import React from 'react'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks'
import { IconButton, Popover, theme as uiTheme } from '@project-atl/ui'
import Lottie from 'react-lottie'

import { useDialogsOpener } from 'app/hooks'
import roowardsRoobetIconAnimationData from 'app/lottiefiles/roowards_roobet_icon_animation.json'
import roowardsEmptyIconAnimationData from 'app/lottiefiles/roowards_empty_roobet_icon_animation.json'
import { useRoowards } from 'app/context'

import { RoowardsContent } from './RoowardsContent'

const GiftAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: roowardsRoobetIconAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
} as const

const EmptyGiftAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: roowardsEmptyIconAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
} as const

export const useRoowardsNavigationStyles = makeStyles(() =>
  createStyles({
    RoowardsPopover: {
      backgroundColor: 'transparent',
      // Need to overwrite Paper's default "top" to assure popover is low enough
      top: '64px !important',
      // So annoying but it's not lined up right with the icon button cause of the button outline, so we need this.
      transform: 'translate(4px, 0) !important',
    },

    RoowardsContentContainer: {
      display: 'flex',
      height: '100%',
      flexDirection: 'column',
      width: 384,

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },
    },

    LottieContainer: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
    },
  }),
)

export const RoowardsNavigation: React.FC = () => {
  const classes = useRoowardsNavigationStyles()
  const openDialog = useDialogsOpener()
  const { rewards, hasReload } = useRoowards()

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'))

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'roowardsPopover',
  })

  const showClaimGiftAnimation =
    hasReload ||
    rewards.some(
      reward => !!(reward.secondsRemaining && reward.secondsRemaining < 0),
    )

  const lottieOptions = showClaimGiftAnimation
    ? GiftAnimationOptions
    : EmptyGiftAnimationOptions

  return (
    <>
      <IconButton
        size={isTabletOrDesktop ? 'medium' : 'small'}
        disableRipple
        {...(isTabletOrDesktop
          ? {
              ...bindTrigger(popupState),
            }
          : {
              onClick: () => openDialog('roowards'),
            })}
        color="tertiary"
        borderOutline={true}
        {...(popupState.isOpen && {
          sx: { backgroundColor: uiTheme.palette.neutral[600] },
        })}
      >
        <div className={classes.LottieContainer}>
          <Lottie options={lottieOptions} height="100%" width="100%" />
        </div>
      </IconButton>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{ paper: { className: classes.RoowardsPopover } }}
      >
        <div className={classes.RoowardsContentContainer}>
          <RoowardsContent />
        </div>
      </Popover>
    </>
  )
}
