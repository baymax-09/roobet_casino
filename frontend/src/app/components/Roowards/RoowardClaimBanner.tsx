import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

import roowardsCoins from 'assets/images/roowardsClaimedCoins.png'
import { getCachedSrc } from 'common/util'

import { Currency } from '../DisplayCurrency'

interface RoowardsClaimedBannerProps {
  title: string
  amount: number
  visible: boolean
}

export const useRoowardsClaimBannerStyles = makeStyles(theme =>
  createStyles({
    RoowardsClaimedBanner: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
      height: '100%',
      width: '100%',
      backgroundColor: uiTheme.palette.primary[500],
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: 0,
      transition: 'opacity 0.5s ease-in-out',
      pointerEvents: 'none',
    },

    RoowardsClaimedBanner_visible: {
      opacity: 1,
      pointerEvents: 'auto',
    },

    RoowardsClaimedBanner__title: {
      textShadow: '0px 2px 0px #5B24C2', // TODO: Maybe make a part of ui theme?
    },

    RoowardsClaimedBanner__amountWrapper: {
      display: 'flex',
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(1.5)}`,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: uiTheme.palette.primary[800],
      borderRadius: 12,
    },

    ClaimedRoowardsCoins: {
      position: 'absolute',
      inset: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    },
  }),
)

export const RoowardsClaimedBanner: React.FC<RoowardsClaimedBannerProps> = ({
  title,
  amount,
  visible,
}) => {
  const classes = useRoowardsClaimBannerStyles()

  return (
    <div
      className={clsx(classes.RoowardsClaimedBanner, {
        [classes.RoowardsClaimedBanner_visible]: visible,
      })}
    >
      <div
        className={classes.ClaimedRoowardsCoins}
        style={{
          backgroundImage: `url(${getCachedSrc({ src: roowardsCoins })}`,
        }}
      />
      <Typography
        className={classes.RoowardsClaimedBanner__title}
        variant="h5"
        fontWeight={uiTheme.typography.fontWeightBlack}
        color={uiTheme.palette.common.white}
        textAlign="center"
        width={270}
        whiteSpace="pre-wrap"
      >
        {title}
      </Typography>
      <div className={classes.RoowardsClaimedBanner__amountWrapper}>
        <Typography
          variant="body1"
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.success[500]}
        >
          <Currency amount={amount} format="0,0.00" />
        </Typography>
      </div>
    </div>
  )
}
