import React from 'react'
import { Card, CardContent, Grid } from '@mui/material'

import { SportsbookBonuses } from './SportsbookBonuses'
import { PragmaticFreespins } from './PragmaticFreespins'
import { HacksawBonuses } from './HacksawBonuses'
import { SoftswissFreespins } from './SoftswissFreespins'
import { type UserData } from '../../types'
import { SlotegratorFreespins } from './SlotegratorFreespins'

import { useProviderBonusesStyles } from './ProviderBonuses.styles'

interface ProviderBonusesProps {
  userData: UserData
  reload: () => void
}

export const ProviderBonuses: React.FC<ProviderBonusesProps> = ({
  userData,
  reload,
}) => {
  const classes = useProviderBonusesStyles()

  const {
    user: { id: userId },
    pragmaticFreespins,
    hacksawFreespins,
    softswissFreespins,
    slotegratorBonuses: sportsbookBonuses,
    slotegratorSlotsFreespins,
  } = userData

  return (
    <Card className={classes.ProviderBonuses}>
      <CardContent>
        <Grid container spacing={4} wrap="wrap">
          <Grid item xs={6}>
            <SportsbookBonuses
              bonuses={sportsbookBonuses ?? []}
              userId={userId}
              reload={reload}
            />
          </Grid>
          <Grid item xs={6}>
            <PragmaticFreespins
              bonuses={pragmaticFreespins ?? []}
              userId={userId}
              reload={reload}
            />
          </Grid>
          <Grid item xs={6}>
            <HacksawBonuses
              bonuses={hacksawFreespins ?? []}
              userId={userId}
              reload={reload}
            />
          </Grid>
          <Grid item xs={6}>
            <SoftswissFreespins
              bonuses={softswissFreespins ?? []}
              userId={userId}
              reload={reload}
            />
          </Grid>
          <Grid item xs={6}>
            <SlotegratorFreespins
              bonuses={slotegratorSlotsFreespins ?? []}
              userId={userId}
              reload={reload}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
