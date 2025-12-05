import React from 'react'
import { usePopupState } from 'material-ui-popup-state/hooks'
import { Button } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { useTranslate } from 'app/hooks'

import { ResultPopover } from '../ResultPopover'

interface ResultPopoverVariantProps {
  error: boolean
}

const useStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      width: 'fit-content',
      height: 'fit-content',
      backgroundColor: theme.palette.primary.main,
      justifyContent: 'center',
      padding: '8px 16px 8px 16px',
      borderRadius: theme.shape.borderRadius,
    },
  }),
)

export const ResultPopoverVariant: React.FC<ResultPopoverVariantProps> = ({
  error,
}) => {
  const anchorRef = React.useRef(null)
  const classes = useStyles()
  const translate = useTranslate()

  const resultPopupState = usePopupState({
    variant: 'popover',
    popupId: 'setUsernamePopover',
  })

  const openResultPopover = () => {
    resultPopupState.open(anchorRef.current)
  }

  return (
    <>
      <Button
        ref={anchorRef}
        variant="contained"
        color="primary"
        className={classes.root}
        onClick={openResultPopover}
      >
        {translate('storybook.buttonText')}
      </Button>
      <ResultPopover
        error={error}
        popupState={resultPopupState}
        message="Popover content."
      />
    </>
  )
}
