import { Check, theme as uiTheme } from '@project-atl/ui'
import React from 'react'
import { Box } from '@mui/material'

interface SuccessMessageProps {
  message: string
}

const styles = {
  container: {
    display: 'inline-flex',
    gap: 0.5,
    alignItems: 'center',
    color: uiTheme.palette.success[500],
  },
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message }) => {
  return (
    <Box component="span" sx={styles.container}>
      <Check
        width="1rem"
        height="1rem"
        iconFill={uiTheme.palette.success[500]}
      />
      {message}
    </Box>
  )
}
