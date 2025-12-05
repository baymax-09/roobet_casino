import React from 'react'
import { ListItem, Typography, Button } from '@mui/material'
import numeral from 'numeral'

import { hasAccess } from 'common/util'
import { useUser } from 'common/hooks'

import { BALANCE_CHANGE_OPERATIONS } from './balanceChanges'

import { useListOverviewStyles } from './ListOverview.styles'

const BalanceListItem = ({
  label,
  balanceType,
  userBalance,
  modifyBalance,
}) => {
  const classes = useListOverviewStyles()
  const user = useUser()
  const userRules = user?.rules ?? []

  return (
    <ListItem disableGutters dense className={classes.listItemButtonContainer}>
      <div className={classes.listItemButtonContainerText}>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          {label}
        </Typography>
        <Typography
          className={`${classes.userFieldValue} ${classes.buttonFieldValue}`}
          variant="body2"
        >
          {numeral(userBalance).format('$0,0.00')}
        </Typography>
      </div>
      {Object.entries(BALANCE_CHANGE_OPERATIONS).map(
        ([operation, getConfig], i) => {
          const config = getConfig(balanceType)

          if (!hasAccess({ userRules, rules: [config.rule] })) {
            return null
          }

          return (
            <div key={operation} className={classes.listItemButtons}>
              <Button
                className={classes.balanceModifier}
                onClick={() => modifyBalance(balanceType, operation)}
              >
                {config.title}
              </Button>
            </div>
          )
        },
      )}
    </ListItem>
  )
}

export default BalanceListItem
