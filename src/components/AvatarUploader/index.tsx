import React, { useCallback, useState } from 'react'
import { useDragDrop } from '../../hooks/useDragDrop'
import { ErrorMessage, ResultDataError } from '../../utils/validation'
import { Box } from '../Box'
import { Button } from '../Button'
import { Container } from '../Container'
import { CloseIcon } from '../Icons/CloseIcon'
import { ExclamationIcon } from '../Icons/ExclamationIcon'
import { PhotoIconBlack, PhotoIconWhite } from '../Icons/PhotoIcon'
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

// const getFileInChunks = (file: File, chunkSize: number) => {
//   const size = file.size
//   const chunks: Chunk[] = []
//   let loadedPosition = 0
//   let index = 0
//   while (loadedPosition <= size) {
//     chunks.push({ blob: file.slice(loadedPosition, chunkSize), index })
//     loadedPosition += chunkSize
//   }
//   return chunks
// }

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
  const [uploaderStatus, setUploaderStatus] = useState<UploadedStatus>('initial')

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

    // upload by chunks
    const size = currentFile.size;
    const reader = new FileReader();
    const chunks: Chunk[] = []
    let loaded = 0;
    let index = 0

    const uploadFile = async (chunks: Chunk[]) => {
      const chunkUploadPromise = chunks.map(async chunk => {
        const uploadResult = await uploadChunk({ file: currentFile, chunk })
        if (uploadResult.error)
          throw uploadResult.error
        setProgress(prev => ({ maxProgress: prev.maxProgress, progress: prev.progress + chunkSize }))
        return uploadResult
      })
      await Promise.all(chunkUploadPromise).then(x => {
        // TODO: implement chunk upload retry 
        const failedUploads = x.find(x => x.error)
        if (failedUploads) {
          setError(failedUploads.error)
        } else {
          setUploaderStatus('cropping')
        }
      }).catch((error: ErrorMessage) => {
        setError(error)
        setUploaderStatus('loading')
      })
    }

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
        uploadFile(chunks)
      }
    };

    // starts loading
    setProgress({ progress: 0, maxProgress: size })
  }, [setError, validateFile, uploadChunk, accept, chunkSize])

  const { isDragging, ...dragDropProps } = useDragDrop({ onDrop })

  return (
    <Container
      {...dragDropProps}
      border={isDragging ? "2px solid deepskyblue" : undefined}
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
        <Box>
          <Box>

          </Box>
          <Box>
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
      )}
      {uploaderStatus === 'cropping' && (
        <div>TODO: cropping</div>
      )}
    </Container>
  )
}