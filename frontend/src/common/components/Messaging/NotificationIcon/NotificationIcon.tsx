import React from 'react'
import {
  ArrowDropDownCircle,
  Cached,
  Money,
  Notifications,
  SentimentSatisfiedAlt,
  SportsCricket,
} from '@mui/icons-material'

import avatarIcon from 'assets/images/notifications/avatar.png'
import rooIcon from 'assets/images/notifications/roo.png'
import freeSpinIcon from 'assets/images/notifications/freeSpin.svg'
import { getCachedSrc } from 'common/util'

import { useNotificationIconStyles } from './NotificationIcon.styles'

const NOTIFICATION_ICONS = {
  tip: {
    asset: getCachedSrc({ src: avatarIcon }),
  },
  rain: {
    asset: getCachedSrc({ src: avatarIcon }),
  },
  koth: {
    asset: getCachedSrc({ src: rooIcon }),
  },
  refund: {
    icon: <Cached style={{ fill: '#0B4D22' }} />,
    background: '#D4FFE2',
  },
  cashback: {
    icon: <Money style={{ fill: '#0B4D22' }} />,
    background: '#26FF70',
  },
  deposit: {
    icon: <Money style={{ fill: '#0B4D22' }} />,
    background: '#26FF70',
  },
  jackpot: {
    icon: <Money style={{ fill: '#0B4D22' }} />,
    background: '#26FF70',
  },
  wager: {
    asset: freeSpinIcon,
    background: '#6E52FF',
  },
  sportsbook: {
    icon: <SportsCricket style={{ fill: '#FFFFFF' }} />,
    background: '#6E52FF',
  },
  withdraw: {
    icon: <ArrowDropDownCircle style={{ fill: '#805F00' }} />,
    background: '#FFF2CC',
  },
  survey: {
    icon: <SentimentSatisfiedAlt style={{ fill: '#2D384D' }} />,
    background: '#EAF1FF',
  },
  hold: {
    icon: <SentimentSatisfiedAlt style={{ fill: '#2D384D' }} />,
    background: '#EAF1FF',
  },
  _default: {
    icon: <Notifications style={{ fill: '#FFFFFF' }} />,
    background: '#6E52FF',
  },
}

interface NotificationIconProps {
  type: string
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ type }) => {
  const classes = useNotificationIconStyles()

  const config =
    type in NOTIFICATION_ICONS
      ? NOTIFICATION_ICONS[type]
      : NOTIFICATION_ICONS._default

  return (
    <div
      className={classes.icon}
      style={{
        backgroundColor: config.background,
        backgroundImage: config.asset ? `url(${config.asset}` : undefined,
      }}
    >
      {config.icon && config.icon}
    </div>
  )
}
