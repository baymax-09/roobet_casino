import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Link } from '@mui/material'

import { useViewOnBlockchairStyles } from './ViewOnBlockchair.styles'

interface ViewOnBlockchairProps {
  hash: string
}

export const ViewOnBlockchair: React.FC<ViewOnBlockchairProps> = ({ hash }) => {
  const classes = useViewOnBlockchairStyles()

  return (
    <Button
      size="small"
      color="primary"
      component={Link}
      href={`https://blockchair.com/search?q=${hash}`}
      target="_blank"
      onClick={evt => evt.stopPropagation()}
    >
      Blockchair{' '}
      <FontAwesomeIcon
        className={classes.externalIcon}
        icon="external-link-alt"
      />
    </Button>
  )
}
