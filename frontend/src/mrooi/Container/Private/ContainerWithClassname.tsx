import React from 'react'
import { Button } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { useTranslate } from 'app/hooks'

import { Container } from '../Container'

const useStyles = makeStyles(() => ({
  root: {
    padding: 20,
    margin: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    width: 'calc(100% - 40px)',
  },
}))

export const ContainerWithClassname = () => {
  const classes = useStyles()
  const translate = useTranslate()

  return (
    <Container className={classes.root}>
      {[...new Array(10)].map((_, index) => {
        return (
          <Button key={index} variant="contained" color="primary">
            {translate('storybook.containerButton')} {index}
          </Button>
        )
      })}
    </Container>
  )
}
