import React from 'react'
import {
  CircularProgress,
  type CircularProgressProps,
  theme as uiTheme,
} from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLockIndicatorStyles = makeStyles(theme =>
  createStyles({
    LockIndicator: {
      display: 'flex',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ContentContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
    },

    CircularBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: uiTheme.palette.neutral[900],
      zIndex: -1,
      border: '4px solid #302427',
    },
  }),
)

interface LockIndicatorProps {
  progress: number
  icon: React.ReactNode
  circularProgressProps?: CircularProgressProps
}

export const LockIndicator: React.FC<LockIndicatorProps> = ({
  progress,
  icon: IconComponent,
  circularProgressProps,
}) => {
  const classes = useLockIndicatorStyles()

  return (
    <div className={classes.LockIndicator}>
      <div className={classes.ContentContainer}>
        <CircularProgress
          color="secondary"
          size={48}
          value={progress}
          {...circularProgressProps}
          variant="determinate"
        />
        <div className={classes.CircularBackground}>{IconComponent}</div>
      </div>
    </div>
  )
}
