import React from 'react'
import { faEye, faEyeSlash } from '@fortawesome/pro-solid-svg-icons'
import { IconButton, type IconButtonProps } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface VisibilityButtonProps extends IconButtonProps {
  showSlashIcon: boolean
}

interface AuthDialogStyleProps {
  showSlashIcon: VisibilityButtonProps['showSlashIcon']
}

export const useVisibilityButtonStyles = makeStyles(() =>
  createStyles({
    VisibilityButton: ({ showSlashIcon }: AuthDialogStyleProps) => ({
      '& span > svg > path': {
        color: showSlashIcon
          ? uiTheme.palette.primary[500]
          : uiTheme.palette.neutral[300],
      },
      '&:hover > span > svg > path': {
        fill: uiTheme.palette.common.white,
      },
    }),
  }),
)

export const VisibilityButton: React.FC<VisibilityButtonProps> = ({
  showSlashIcon,
  ...props
}) => {
  const classes = useVisibilityButtonStyles({ showSlashIcon })

  return (
    <IconButton
      className={classes.VisibilityButton}
      tabIndex={-1}
      size="small"
      {...props}
    >
      <FontAwesomeIcon icon={!showSlashIcon ? faEyeSlash : faEye} />
    </IconButton>
  )
}
