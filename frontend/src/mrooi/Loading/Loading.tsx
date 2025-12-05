import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'

import { useTranslate } from 'app/hooks'

import { useLoadingStyles } from './Loading.styles'

interface LoadingProps {
  text?: string
  className?: string
}

export const Loading: React.FC<LoadingProps> = props => {
  const translate = useTranslate()
  const classes = useLoadingStyles()

  return (
    <div className={classes.Loading}>
      {props.text ? <div>{translate('generic.loading')}</div> : null}
      <div className={clsx(classes.spinner, props.className)}>
        <FontAwesomeIcon icon="spinner" />
      </div>
    </div>
  )
}
