import React from 'react'
import { Button, FormGroup, Input, Typography } from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import clsx from 'clsx'

import { Loading } from 'mrooi'
import {
  prettyPrintSize,
  calculateImageDimensions,
  uploadImage,
} from 'common/util'
import { useToasts } from 'common/hooks'

import { useImagePreviewUploadStyles } from './ImagePreviewUpload.styles'

interface ImagePreviewUploadProps {
  id: string
  identifier: string
  title?: string
  helpText?: string
  previewClassName?: string
  url: string
  setUrl: (url: any) => void
  maxSize?: number
  width?: number
  height?: number
  customImageUpload?: (identifier: string, file: File) => Promise<string>
}

export const ImagePreviewUpload: React.FC<ImagePreviewUploadProps> = ({
  id,
  identifier,
  title,
  helpText,
  previewClassName,
  url,
  setUrl,
  maxSize,
  width,
  height,
  customImageUpload,
}) => {
  const classes = useImagePreviewUploadStyles()
  const [src, setSrc] = React.useState<string | undefined>(url)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToasts()

  const onLoadError = () => setSrc(undefined)

  const error = React.useCallback(
    message => {
      toast.error(message)
    },
    [toast],
  )

  const handleUpload = React.useCallback(
    async file => {
      if (file) {
        if (maxSize && file.size > maxSize) {
          return error(
            `The image must be less than or equal to ${prettyPrintSize(
              maxSize,
            )}.`,
          )
        }

        if (width && height) {
          const dimensions = await calculateImageDimensions(file)

          if (width !== dimensions.width) {
            return error(`The image must be exactly ${width}px in width.`)
          }

          if (height !== dimensions.height) {
            return error(`The image must be exactly ${width}px in height.`)
          }
        }

        setLoading(true)

        try {
          // Upload image to public S3 bucket.
          const url = customImageUpload
            ? await customImageUpload(identifier, file)
            : await uploadImage(identifier, file)

          setUrl(url)
        } catch (error: any) {
          toast.error(`An error occurred uploading the image: ${error.message}`)
        } finally {
          setLoading(false)
        }
      }
    },
    [
      maxSize,
      width,
      height,
      error,
      customImageUpload,
      identifier,
      setUrl,
      toast,
    ],
  )

  const onDrop = React.useCallback(
    files => {
      handleUpload(files[0])
    },
    [handleUpload],
  )

  const clearSrc = React.useCallback(() => {
    setUrl(null)
  }, [setUrl])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: 1,
  })

  // Set src on prop change.
  React.useEffect(() => setSrc(url), [url])

  return (
    <>
      {title && <Typography variant="h6">{title}</Typography>}
      <div
        className={classes.root}
        {...getRootProps()}
        onClick={() => undefined}
      >
        <FormGroup
          className={clsx({
            [classes.dragActive]: isDragActive,
            [classes.fileActive]: !!src,
          })}
        >
          <div className={clsx(classes.imgPreviewContainer, previewClassName)}>
            {loading && <Loading />}
            {!loading && !src ? (
              <div className={classes.dropZone} onClick={open}>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <div className={classes.dropZoneTitle}>Select Image</div>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <div>You can drag and drop files to upload them.</div>
              </div>
            ) : null}
            {!loading && src && (
              <img
                alt=""
                src={src}
                className={classes.imgPreview}
                onError={onLoadError}
              />
            )}
          </div>
          <Input
            name={id}
            className={classes.fileInput}
            type="file"
            inputProps={{
              id,
              accept: 'image/jpeg,image/png',
              onChange: onDrop,
              ...getInputProps(),
            }}
          />
          <div className={classes.actions}>
            <Button
              className={classes.actionBtn}
              onClick={open}
              variant="text"
              size="small"
              disabled={loading}
              component="span"
            >
              <Edit />
            </Button>
            <Button
              className={classes.actionBtn}
              onClick={clearSrc}
              variant="text"
              size="small"
              disabled={loading}
              component="span"
            >
              <Delete />
            </Button>
          </div>
        </FormGroup>
      </div>
      {helpText && (
        <Typography className={classes.helpText}>{helpText}</Typography>
      )}
    </>
  )
}
