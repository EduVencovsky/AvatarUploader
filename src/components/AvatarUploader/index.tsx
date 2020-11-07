import React, { useCallback, useRef, useState } from 'react'
import { useDragDrop } from '../../hooks/useDragDrop'
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

interface FileChunk {
  chunk: Chunk
  file: Pick<File, 'type' | 'size' | 'name' | 'lastModified'>
}

interface Chunk {
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
const defaultFileValidation = (files: FileList, accept: AvatarUploaderProps['accept']): ResultDataError<boolean, ErrorMessage> => {
  let error = null
  let data = false

  // allow only single file to be droped
  if (files.length > 1)
    error = 'Can only upload 1 file'

  const currentFile = files[0]
  if (accept && currentFile.type !== accept) { // validate if file is an image
    error = `File must be of type ${accept}`
  }
  else if (!currentFile.type.includes('image/')) { // validate if file is an image
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
  const [progress, setProgress] = useState<{ progress: number, maxProgress: number }>({ progress: 0, maxProgress: 0 })
  const [uploaderStatus, setUploaderStatus] = useState<UploadedStatus>('loading')
  const cancelationToken = useRef({ isCanceled: false })

  const resetState = useCallback(() => {
    setError(null)
    setAvatarFile(undefined)
    setProgress({ progress: 0, maxProgress: 0 })
    setUploaderStatus('initial')
    cancelationToken.current.isCanceled = true  
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    const files = e.dataTransfer.files
    // default component validation
    const defaultValidation = defaultFileValidation(files, accept)
    if (!defaultValidation.data) {
      return setError(defaultValidation.error)
    }

    const currentFile = files[0]
    // allow any custom validation
    if (validateFile) {
      const fileValidation = validateFile(currentFile)
      if (!fileValidation.data) {
        return setError(fileValidation.error)
      }
    }

    // reset any previous validation
    setError(null)
    // start loading file
    setAvatarFile(currentFile)
    setUploaderStatus('loading')
    cancelationToken.current.isCanceled = false  

    // upload by chunks
    const size = currentFile.size;
    const reader = new FileReader();
    const chunks: Chunk[] = []

    const uploadFile = async (chunks: Chunk[]) => {
      // Upload all chunks at once
      const chunkUploadPromise = chunks.map(async chunk => {
        const uploadResult = await uploadChunk({ file: currentFile, chunk })
        if (uploadResult.error)
          throw uploadResult.error
        if(cancelationToken.current.isCanceled)
          throw CANCELATION_TOKEN_ERROR
        setProgress(prev => ({ maxProgress: prev.maxProgress, progress: prev.progress + chunkSize }))
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
    let chunk = currentFile.slice(0, chunkSize);
    reader.readAsBinaryString(chunk);
    reader.onload = function (e) {
      chunks.push({ chunk: e.target?.result, index })
      index++
      loaded += chunkSize;
      if (loaded <= size) {
        chunk = currentFile.slice(loaded, loaded + chunkSize);
        reader.readAsBinaryString(chunk);
      } else {
        loaded = size;
        // starts loading
        setProgress({ progress: 0, maxProgress: size })
        uploadFile(chunks)
      }
    };

  }, [setError, validateFile, uploadChunk, accept, chunkSize])

  const { isDragging, ...dragDropProps } = useDragDrop({ onDrop })
  console.log(progress)
  return (
    <Container
      {...dragDropProps}
      border={`2px dashed ${isDragging ? 'deepskyblue' : '#C7CDD3'}`}
      width="553px"
      height="177px"
      borderRadius="8px">
      {uploaderStatus === 'initial' && (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
          <Box>
            {logo ?? (
              <Typography variant="title">
                <Box pr={10} display="inline">
                  <PhotoIconBlack />
                </Box>
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="text">{description ?? 'Drop the image here or click to browse.'}</Typography>
          </Box>
          {error && (
            <Box>
              <Typography variant="error">{error}</Typography>
            </Box>
          )}
        </Box>
      )}
      {uploaderStatus === 'loading' && progress && (
        <Box display="flex" height="100%">
          <Box flex={1} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            {/* TODO: Fix the display of the image cropping */}
            <ImageCroppingDisplay
              height="0"
              pb="100%"
              width="100%"
            />
          </Box>
          <Box flex={3} padding={10} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Box width="100%">
              {error ? (
                <Typography variant="error">{error}</Typography>
              ) : (
                  <Typography>
                    {avatarFile?.name}
                  </Typography>
                )}
              <LoadingBar maxProgress={progress.maxProgress} progress={progress.progress} />
            </Box>
          </Box>
          <Box>
            <Button variant='text' onClick={resetState}>
              <CloseIcon />
            </Button>
          </Box>
        </Box>
      )}
      {uploaderStatus === 'cropping' && (
        <div>TODO: cropping</div>
      )}
    </Container>
  )
}