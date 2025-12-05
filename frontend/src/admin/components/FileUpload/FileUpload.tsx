import React from 'react'
import { Button } from '@mui/material'
import { type AlertType, DropzoneArea } from 'mui-file-dropzone'
import clsx from 'clsx'

import { Loading } from 'mrooi'
import { useAxiosPost, useToasts } from 'common/hooks'
import { useTranslate } from 'app/hooks'
import { api } from 'common/util'

import { useFileUploadStyles } from './FileUpload.styles'

interface FileUploadProps {
  /** @link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept separate elements */
  acceptedFiles: string[]
  endpoint: string
  submitButtonColor?: 'primary' | 'secondary'
  dropzoneText?: string
  submitButtonText?: string
  actionsClassName?: string
  extraFormData?: Record<string, string>
  prependFileName?: string
  userId?: string
  onCompleted?: () => void
  disabled: boolean
}

type S3SignedPostField =
  | 'key'
  | 'bucket'
  | 'X-Amz-Algorithm'
  | 'X-Amz-Credential'
  | 'X-Amz-Date'
  | 'Policy'
  | 'X-Amz-Signature'

interface S3SignedPostArgs {
  fileName: string
  prependFileName?: string
}

interface S3SignedPostResponse {
  url: string
  fields: Record<S3SignedPostField, string>
  hashedFileName: string
}

/**
 * Currently only accepts 1 file at a time, state management
 * and styles will need to be updated to support more than 1.
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  acceptedFiles,
  endpoint,
  dropzoneText,
  submitButtonText,
  submitButtonColor = 'primary',
  actionsClassName,
  extraFormData = {},
  prependFileName,
  userId,
  onCompleted,
  disabled,
}) => {
  const classes = useFileUploadStyles()
  const translate = useTranslate()
  const { toast } = useToasts()

  // @see https://github.com/Yuvaleros/material-ui-dropzone/issues/9
  const [dropzoneNonce, setDropzoneNonce] = React.useState<number>(0)

  const [s3UploadLoading, setS3UploadLoading] = React.useState<boolean>(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [S3ResponseData, setS3ResponseData] =
    React.useState<S3SignedPostResponse | null>(null)

  const emptyFiles = React.useCallback(() => {
    setFiles([])
  }, [setFiles])

  const [submitForm, { loading: uploadFileLoading }] = useAxiosPost(endpoint, {
    onCompleted,
    onError: error => {
      const message =
        typeof error.message === 'string'
          ? error.message
          : translate('mrooi.fileUpload.error')

      toast.error(message)
    },
  })

  const onAlert = (message: string, variant: AlertType) => {
    // Do not show file attached message.
    if (variant === 'success') {
      return
    }

    if (variant === 'error') {
      toast.error(message)
      return
    }

    toast.info(message)
  }

  const onSubmit = React.useCallback(async () => {
    setS3UploadLoading(true)

    const { url: signedUrl, fields, hashedFileName } = S3ResponseData!
    const file = files[0]

    const s3FormData = new FormData()

    // Needed form data for uploading to S3
    s3FormData.append('Content-Type', file.type)

    for (const [key, value] of Object.entries(fields)) {
      s3FormData.append(key, value)
    }

    // The file must come after the key (from fields above).
    s3FormData.append('file', file)

    try {
      const response = await fetch(signedUrl, {
        method: 'POST',
        body: s3FormData,
      })

      if (response.ok) {
        submitForm({
          variables: {
            hashedFileName,
            ...extraFormData,
          },
        })
      } else {
        const responseBody = await response.text()

        // S3 signed url Link has expired
        if (
          response.status === 403 &&
          responseBody.includes('Policy expired')
        ) {
          toast.error(translate('mrooi.fileUpload.linkExpired'))
          return
        }

        toast.error(translate('mrooi.fileUpload.error'))
      }
    } catch (error) {
      toast.error(translate('mrooi.fileUpload.error'))
    } finally {
      setS3UploadLoading(false)
      setS3ResponseData(null)

      setTimeout(() => {
        setDropzoneNonce(nonce => nonce + 1)
        setFiles([])
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraFormData, files, submitForm, S3ResponseData, toast])

  // Fetch the S3 signed URL when the user drags and drops a file
  React.useEffect(() => {
    const fetchS3SignedURL = async () => {
      try {
        const response = await api.get<S3SignedPostArgs, S3SignedPostResponse>(
          '/account/generateS3SignedURL',
          {
            params: {
              fileName: files[0].name,
              ...(prependFileName && { prependFileName }),
              userId,
            },
          },
        )
        setS3ResponseData(response)
      } catch (err) {
        toast.error(translate('mrooi.fileUpload.error'))
      }
    }

    if (files.length && userId) {
      fetchS3SignedURL()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, userId, prependFileName, toast])

  if (disabled) {
    return null
  }

  const loading = s3UploadLoading || uploadFileLoading

  return (
    <>
      <div
        className={clsx(classes.container, {
          [classes.hideDropzone]: !!files.length,
        })}
      >
        {loading && (
          <div className={classes.loadingOverlay}>
            <Loading />
          </div>
        )}
        <DropzoneArea
          key={dropzoneNonce}
          acceptedFiles={acceptedFiles}
          dropzoneClass={classes.dropzone}
          previewGridClasses={{
            item: classes.previewItem,
          }}
          dropzoneText={
            dropzoneText ?? translate('mrooi.fileUpload.dragAndDrop')
          }
          filesLimit={1}
          maxFileSize={5000000} // 5 MB
          onDrop={setFiles}
          onDelete={emptyFiles}
          showPreviewsInDropzone={false}
          showFileNamesInPreview={true}
          showPreviews={true}
          previewText=""
          showAlerts={false}
          onAlert={onAlert}
          classes={{ text: classes.root, icon: classes.root }}
          fileObjects={undefined}
        />
      </div>
      <div className={actionsClassName}>
        <Button
          disabled={!files.length || loading}
          color={submitButtonColor}
          type="submit"
          onClick={onSubmit}
        >
          {submitButtonText ?? translate('mrooi.fileUpload.save')}
        </Button>
      </div>
    </>
  )
}
