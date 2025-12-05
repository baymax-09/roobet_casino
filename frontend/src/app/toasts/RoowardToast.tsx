import React from 'react'
import {
  useSpring,
  useChain,
  config,
  animated,
  type AnimatedValue,
} from 'react-spring'
import LaunchIcon from '@mui/icons-material/Launch'
import {
  SnackbarContent,
  type VariantOverrides,
  closeSnackbar,
} from 'notistack'

import { DialogToggle } from 'mrooi'
import { useTranslate } from 'app/hooks'
import { getRoowardsIcon } from 'app/util'
import { Currency } from 'app/components/DisplayCurrency'

import { useRoowardToastStyles } from './RoowardToast.styles'

const levelNameTranslationKeys = {
  /* eslint-disable id-length */
  d: 'reward.dailyName',
  w: 'reward.weeklyName',
  m: 'reward.monthlyName',
  /* eslint-enable id-length */
}

type RoowardToastProps = VariantOverrides['roowardsToast']

export const RoowardToast = React.forwardRef<HTMLDivElement, RoowardToastProps>(
  ({ type, level, mode = 'levelUp', claimedAmount }, ref) => {
    const translate = useTranslate()

    const levelNameTranslationKey = levelNameTranslationKeys[type]
    const levelName = levelNameTranslationKey
      ? translate(levelNameTranslationKey)
      : ''

    const imageSpringRef = React.useRef(null)
    const imageSpring = useSpring({
      ref: imageSpringRef,
      config: config.stiff,
      delay: 200,
      to: {
        scale: 1,
      },
      from: {
        scale: 0,
      },
    }) as AnimatedValue<{ scale: number }>

    const levelSpringRef = React.useRef(null)
    const levelSpring = useSpring({
      ref: levelSpringRef,
      config: config.stiff,
      delay: 400,
      to: {
        scale: [1, 0],
      },
      from: {
        scale: [0, 15],
      },
    }) as AnimatedValue<{ scale: any }>

    const classes = useRoowardToastStyles()

    useChain([imageSpringRef, levelSpringRef])

    const details = React.useMemo(() => {
      if (mode === 'claim') {
        return (
          <div className={classes.details}>
            <div className={classes.header}>
              <div className={classes.headerText}>
                {translate('rewardToast.ready')}
              </div>
            </div>
            <div className={classes.message}>
              {translate('rewardToast.your')}{' '}
              <span className={classes.level}>{levelName}</span>{' '}
              {translate('rewardToast.isNowReadyToBeClaimed')}
            </div>
            <DialogToggle
              dialog="roowards"
              startIcon={<LaunchIcon />}
              className={classes.claimButton}
              fullWidth
              size="small"
              variant="contained"
              color="secondary"
            >
              {translate('rewardToast.open')}
            </DialogToggle>
          </div>
        )
      } else if (mode === 'claimed') {
        return (
          <div className={classes.details}>
            <div className={classes.header}>
              <div className={classes.headerText}>
                {translate('rewardToast.claimed')}
              </div>
            </div>
            <div className={classes.message}>
              <span className={classes.level}>
                <Currency amount={claimedAmount || 0} />
              </span>{' '}
              {translate('rewardToast.wasClaimedFromYour')} {levelName}.
            </div>
          </div>
        )
      }

      return (
        <div className={classes.details}>
          <div className={classes.header}>
            <div className={classes.headerText}>
              {translate('rewardToast.levelUp')}
            </div>
          </div>
          <div className={classes.message}>
            {translate('rewardToast.your')}{' '}
            <span className={classes.name}>{levelName}</span>{' '}
            {translate('rewardToast.hasNowReached')}{' '}
            <span className={classes.level}>
              {translate('rewardToast.level')} {level.level}
            </span>
            .
          </div>
        </div>
      )
    }, [
      mode,
      classes.details,
      classes.header,
      classes.headerText,
      classes.message,
      classes.name,
      classes.level,
      classes.claimButton,
      translate,
      levelName,
      level.level,
      claimedAmount,
    ])

    return (
      <SnackbarContent ref={ref}>
        <div className={classes.root} onClick={() => closeSnackbar()}>
          <div className={classes.RoowardsLevelUpToast}>
            <div className={classes.imageContainer}>
              <animated.div
                className={classes.levelImage}
                style={{
                  transform: imageSpring.scale.interpolate(
                    scale => `scale(${scale})`,
                  ),
                  backgroundImage: `url(${getRoowardsIcon({
                    type,
                    level: level.level,
                  })})`,
                }}
              />
              <animated.div
                className={classes.levelContainer}
                style={{
                  transform: levelSpring.scale.interpolate(
                    (scale, translate) =>
                      `scale(${scale}) translate3d(0, ${translate}px, 0)`,
                  ),
                }}
              >
                <div className={classes.newLevel}>{level.level}</div>
              </animated.div>
            </div>
            {details}
          </div>
        </div>
      </SnackbarContent>
    )
  },
)
