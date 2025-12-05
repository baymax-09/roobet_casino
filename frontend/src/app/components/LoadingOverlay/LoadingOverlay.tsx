import React from 'react'
import { LinearProgress } from '@mui/material'

import { GeneralLoadingContext } from 'app/context'

import { useLoadingOverlayStyles } from './LoadingOverlay.styles'

const LOADING_DELAY_MS = 200

export const LoadingOverlay = () => {
  const classes = useLoadingOverlayStyles()
  const { isLoading } = React.useContext(GeneralLoadingContext)
  const [pastDelay, setPastDelay] = React.useState(false)

  React.useEffect(() => {
    setPastDelay(false)

    if (isLoading) {
      // Prevent content flashing with render delay.
      const timeout = setTimeout(() => {
        setPastDelay(true)
      }, LOADING_DELAY_MS)

      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  if (!isLoading || !pastDelay) {
    return null
  }

  return (
    <div className={classes.Loading}>
      <LinearProgress className={classes.Loading__progress} />
    </div>
  )
}
