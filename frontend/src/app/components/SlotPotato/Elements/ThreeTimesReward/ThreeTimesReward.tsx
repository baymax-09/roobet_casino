import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'

import { TEXT_SHADOW_COLOR, TEXT_SHADOW_COLOR_2 } from '../../constants'

export const useThreeTimesRewardsStyles = makeStyles(() =>
  createStyles({
    ThreeTimesRewards: {
      textShadow: `0px 2px 0px ${TEXT_SHADOW_COLOR}`,
      zIndex: 1,

      [uiTheme.breakpoints.up('md')]: {
        textShadow: `0px 2px 0px ${TEXT_SHADOW_COLOR_2}`,
      },
    },
  }),
)

export const ThreeTimesRewards: React.FC = () => {
  const classes = useThreeTimesRewardsStyles({ bannerBackgroundImage: '' })
  const translate = useTranslate()

  return (
    <Typography
      className={classes.ThreeTimesRewards}
      variant="body2"
      textAlign="center"
      fontWeight={uiTheme.typography.fontWeightBlack}
      color={uiTheme.palette.common.white}
    >
      {translate('slotPotato.playWith3TimesRewards')}
    </Typography>
  )
}
