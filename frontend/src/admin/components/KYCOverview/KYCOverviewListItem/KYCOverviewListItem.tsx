import React from 'react'
import { Typography, ListItem } from '@mui/material'

import { useKYCOverviewListItemStyles } from './KYCOverviewListItem.styles'

interface KYCOverviewListItemProps {
  field: string
  value?: string | number
  failureMessage?: string
}

export const KYCOverviewListItem: React.FC<
  KYCOverviewListItemProps
> = props => {
  const classes = useKYCOverviewListItemStyles()

  return (
    <ListItem disableGutters key={props.field} dense>
      <Typography
        classes={{ body2: classes.KYCLevel1DetailsContainer__userFieldName }}
        variant="body2"
        color="textSecondary"
      >
        {props.field}
      </Typography>
      <Typography
        classes={{ body2: classes.KYCLevel1DetailsContainer__userFieldValue }}
        variant="body2"
        color="primary"
      >
        {props.value || 'N/A'}
      </Typography>
      {props.failureMessage && (
        <Typography
          classes={{
            root: classes.KYCLevel1DetailsContainer__failureField,
          }}
          variant="body2"
          color="error"
        >
          {props.failureMessage}
        </Typography>
      )}
    </ListItem>
  )
}
