import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { useTranslate } from 'app/hooks'

import { Button } from '../Button'
import { ButtonTypeKeys } from '../types'

export const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      width: 'fit-content',
      gap: 5,
    },
  }),
)

export const AllButtonTypes = props => {
  const classes = useStyles()
  const translate = useTranslate()

  return (
    <div className={classes.root}>
      {ButtonTypeKeys.map(type => (
        <Button key={type} type={type} {...props}>
          {translate('accountDialog.completed')}
        </Button>
      ))}
    </div>
  )
}
