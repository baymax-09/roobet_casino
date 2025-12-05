import React from 'react'
import clsx from 'clsx'
import numeral from 'numeral'
import { Typography } from '@mui/material'

import { useTranslate } from 'app/hooks'

import { useRaffleBannerRibbonsStyles } from './RaffleBannerRibbons.styles'

interface RaffleBannerRibbonsProps {
  winnerCount: number
  winnersText?: string
  tickets: number
  ticketsText?: string
}

export const RaffleBannerRibbons: React.FC<RaffleBannerRibbonsProps> = ({
  winnerCount,
  tickets,
  winnersText,
  ticketsText,
}) => {
  const translate = useTranslate()
  const classes = useRaffleBannerRibbonsStyles()

  return (
    <div className={classes.RaffleBanner__ribbons}>
      <span className={classes.Ribbons__winnersRibbon}>
        <span>
          {winnerCount}
          <Typography variant="body2">
            {winnersText ?? translate('raffle.winners')}
          </Typography>
        </span>
      </span>
      <span
        className={clsx(
          classes.Ribbons__winnersRibbon,
          classes.Ribbons__ticketRibbon,
        )}
      >
        <span>
          {numeral(tickets).format('0,0')}
          <Typography variant="body2">
            {ticketsText ?? translate('raffle.yourTickets')}
          </Typography>
        </span>
      </span>
    </div>
  )
}
