import React from 'react'
import { Button, IconButton, Tooltip } from '@mui/material'
import { Help } from '@mui/icons-material'

import { parseCsvFile } from 'admin/util'

interface BulkRecipientUploadButtonProps {
  addRecipients: (recipients: string[]) => void
}

export const BulkRecipientUploadButton: React.FC<
  BulkRecipientUploadButtonProps
> = ({ addRecipients }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const onFileChange = React.useCallback(
    async evt => {
      const file = evt.target.files[0]

      if (!file) {
        return
      }

      const data = await parseCsvFile(file, undefined)

      // Push recipients to parent.
      addRecipients(data.map(row => row[0]))

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [addRecipients],
  )

  const openFileDialog = React.useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <>
      <input
        ref={inputRef}
        onChange={onFileChange}
        type="file"
        style={{ display: 'none' }}
      />
      <Button onClick={openFileDialog} variant="contained" size="small">
        Bulk Upload
      </Button>
      <Tooltip title="Accepts a CSV with a single column of mixed userIds and usernames.">
        <IconButton size="large">
          <Help />
        </IconButton>
      </Tooltip>
    </>
  )
}
