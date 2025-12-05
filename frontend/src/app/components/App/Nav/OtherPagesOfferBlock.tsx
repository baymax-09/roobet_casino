import React from 'react'
import { IconMenuList, theme as uiTheme } from '@project-atl/ui'
import {
  FreePlay,
  Promotions,
  Redeem,
  ReferAndEarn,
} from '@project-atl/ui/assets'
import { useLocation } from 'react-router'
import { useMediaQuery } from '@mui/material'

import { useTranslate, useDialogsOpener } from 'app/hooks'

import { tooltipMessage } from './utils'
interface OtherPagesOfferBlockProps {
  showOnlyIcons: boolean
}

export const OtherPagesOfferBlock: React.FC<OtherPagesOfferBlockProps> = ({
  showOnlyIcons,
}) => {
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const location = useLocation()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const offerItems = [
    {
      key: 'promotions',
      icon: Promotions,
      text: translate('navbar.promotions'),
      buttonProps: {
        target: '_blank',
        href: 'https://promotions.roobet.com',
      },
      ...(showOnlyIcons &&
        isTabletOrDesktop && {
          tooltipProps: {
            title: tooltipMessage(translate('navbar.promotions')),
          },
        }),
    },
    {
      key: 'referAndEarn',
      icon: ReferAndEarn,
      text: translate('navbar.referAndEarn'),
      buttonProps: {
        onClick: () => openDialog('affiliate'),
      },
      active: location.search.includes('?modal=affiliate'),
      ...(showOnlyIcons &&
        isTabletOrDesktop && {
          tooltipProps: {
            title: tooltipMessage(translate('navbar.referAndEarn')),
          },
        }),
    },
    {
      key: 'redeem',
      icon: Redeem,
      text: translate('navbar.redeem'),
      buttonProps: {
        onClick: () => openDialog('redeem'),
      },
      active: location.search.includes('?modal=redeem'),
      ...(showOnlyIcons &&
        isTabletOrDesktop && {
          tooltipProps: {
            title: tooltipMessage(translate('navbar.redeem')),
          },
        }),
    },
    {
      key: 'freePlay',
      icon: FreePlay,
      text: translate('navbar.freePlay'),
      buttonProps: {
        onClick: () => openDialog('freePlay'),
      },
      active: location.search.includes('?modal=freePlay'),
      ...(showOnlyIcons &&
        isTabletOrDesktop && {
          tooltipProps: {
            title: tooltipMessage(translate('navbar.freePlay')),
          },
        }),
    },
    // TODO: Uncomment once finished with site hosted "News" page
    // {
    //   key: 'news',
    //   icon: News,
    //   text: translate('navbar.news'),
    //   buttonProps: {
    //     target: '_blank',
    //     href: 'https://news.roobet.com',
    //   },
    //   ...(showOnlyIcons &&
    //     isTabletOrDesktop && {
    //       tooltipProps: {
    //         title: tooltipMessage(translate('navbar.news')),
    //       },
    //     }),
    // },
  ]

  return <IconMenuList items={offerItems} showOnlyIcons={showOnlyIcons} />
}
