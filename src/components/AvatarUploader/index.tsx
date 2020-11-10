import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDragDrop } from '../../hooks/useDragDrop'
import { getImageBase64 } from '../../utils'
import { ErrorMessage, ResultDataError } from '../../utils/validation'
import { Box } from '../Box'
import { Button } from '../Button'
import { Container } from '../Container'
import { CloseIcon } from '../Icons/CloseIcon'
import { ExclamationIcon } from '../Icons/ExclamationIcon'
import { PhotoIconBlack, PhotoIconWhite } from '../Icons/PhotoIcon'
import { ImageCroppingDisplay } from '../ImageCroppingDisplay'
import { LoadingBar } from '../LoadingBar'
import { Slider } from '../Slider'
import { Typography } from '../Typography'
import { UploaderInitialContent } from './UploaderInitialContent'
import { UploaderLoadingContent } from './UploaderLoadingContent'

export interface FileChunk {
  chunk: Chunk
  file: Pick<File, 'type' | 'size' | 'name' | 'lastModified'>
}

export interface Chunk {
  chunk: string | ArrayBuffer | null | undefined
  index: number
}

interface AvatarUploaderProps {
  validateFile?: (file: File) => ResultDataError<boolean, ErrorMessage>
  accept?: string
  logo?: React.ReactNode
  description?: string
  chunkSize?: number
  uploadChunk: (chunk: FileChunk) => Promise<ResultDataError<FileChunk, ErrorMessage>>
}

const CANCELATION_TOKEN_ERROR = '__CANCELATION_TOKEN_ERROR__'

type UploadedStatus = 'initial' | 'loading' | 'cropping' | 'done'

// Only allow one file to be upload and it must be an image
const defaultFileValidation = (file: File, accept: AvatarUploaderProps['accept']): ResultDataError<boolean, ErrorMessage> => {
  let error = null
  let data = false

  if (accept && file.type !== accept) { // validate if file is an image
    error = `File must be of type ${accept}`
  }
  else if (!file.type.includes('image/')) { // validate if file is an image
    error = 'File must be an image'
  }
  data = true
  return { data, error }
}

export const AvatarUploader = ({
  validateFile,
  accept,
  logo,
  description,
  uploadChunk,
  chunkSize = 1024
}: AvatarUploaderProps) => {

  // TODO: make this a reducer instead of using many states
  const [error, setError] = useState<ErrorMessage>(null)
  const [avatarFile, setAvatarFile] = useState<File>()
  const [avatarFileBase64, setAvatarFileBase64] = useState<string | undefined>()
  const [loadingStatus, setLoadingStatus] = useState<{ progress: number, maxProgress: number }>({ progress: 0, maxProgress: 0 })
  const [uploaderStatus, setUploaderStatus] = useState<UploadedStatus>('loading')
  const cancelationToken = useRef({ isCanceled: false })

  useEffect(() => {
    const getBase64 = async () => {
      if (avatarFile) {
        try {
          const base64 = await getImageBase64<string>(avatarFile)
          setAvatarFileBase64(base64)
        } catch (error) {
          setAvatarFileBase64(undefined)
        }
      }
    }
    getBase64()
  }, [avatarFile])

  const resetState = useCallback(() => {
    setError(null)
    setAvatarFile(undefined)
    setLoadingStatus({ progress: 0, maxProgress: 0 })
    setUploaderStatus('initial')
    cancelationToken.current.isCanceled = true
  }, [])

  const uploadFile = useCallback((file: File) => {
    // default component validation
    const defaultValidation = defaultFileValidation(file, accept)
    if (!defaultValidation.data) {
      return setError(defaultValidation.error)
    }
    // allow any custom validation
    if (validateFile) {
      const fileValidation = validateFile(file)
      if (!fileValidation.data) {
        return setError(fileValidation.error)
      }
    }

    // reset any previous validation
    setError(null)
    // start loading file
    setAvatarFile(file)
    setUploaderStatus('loading')
    cancelationToken.current.isCanceled = false

    // upload by chunks
    const size = file.size;
    const reader = new FileReader();
    const chunks: Chunk[] = []

    const uploadFileByChunks = async (chunks: Chunk[]) => {
      // Upload all chunks at once
      const chunkUploadPromise = chunks.map(async chunk => {
        const uploadResult = await uploadChunk({ file: file, chunk })
        if (uploadResult.error) {
          cancelationToken.current.isCanceled = true
          throw uploadResult.error
        }
        if (cancelationToken.current.isCanceled) {
          throw CANCELATION_TOKEN_ERROR
        }
        setLoadingStatus(prev => ({ maxProgress: prev.maxProgress, progress: prev.progress + chunkSize }))
        return uploadResult
      })

      try {
        await Promise.all(chunkUploadPromise)
        setUploaderStatus('cropping')
      } catch (error) {
        if (error instanceof Error) {
          setError('Sorry, the upload failed.')
        }
        else if (typeof error === 'string') {
          if (error === CANCELATION_TOKEN_ERROR) {
            return
          }
          setError(error)
        }
        setUploaderStatus('loading')
      }
    }

    let loaded = 0;
    let index = 0
    // initial chunk
    let chunk = file.slice(0, chunkSize);
    reader.readAsBinaryString(chunk);
    reader.onload = function (e) {
      chunks.push({ chunk: e.target?.result, index })
      index++
      loaded += chunkSize;
      if (loaded <= size) {
        chunk = file.slice(loaded, loaded + chunkSize);
        reader.readAsBinaryString(chunk);
      } else {
        loaded = size;
        // starts loading
        setLoadingStatus({ progress: 0, maxProgress: size })
        uploadFileByChunks(chunks)
      }
    };
  }, [setError, validateFile, uploadChunk, accept, chunkSize])

  const onDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    const files = e.dataTransfer.files
    // allow only single file to be droped
    if (files.length > 1) {
      resetState()
      return setError('Can only upload 1 file')
    }

    uploadFile(files[0])
  }, [uploadFile, resetState])

  const { isDragging, ...dragDropProps } = useDragDrop({ onDrop })

  return (
    <Container
      {...dragDropProps}
      border={`2px dashed ${isDragging ? 'deepskyblue' : '#C7CDD3'}`}
      width="553px" // Fix this
      height="177px"
      borderRadius="8px">
      {uploaderStatus === 'initial' && (
        <UploaderInitialContent {...{ logo, description, error }} />
      )}
      {uploaderStatus === 'loading' && loadingStatus && (
        <UploaderLoadingContent
          error={error}
          file={avatarFile}
          onReset={resetState}
          onTryAgain={() => avatarFile != null ? uploadFile(avatarFile) : undefined}
          {...loadingStatus}
        />
      )}
      {uploaderStatus === 'cropping' && (
        <div>
          {/* TODO: cropping */}
          <img
            height="100"
            width="100" src={avatarFileBase64}
            alt="uploaded file representation"
          />
        </div>
      )}
    </Container>
  )
}