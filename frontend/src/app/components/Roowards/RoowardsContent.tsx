import React from 'react'
import { useSelector } from 'react-redux'
import { useTrail, animated, config } from 'react-spring'
import { theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { useRoowards } from 'app/context'
import { RoowardsBonusAmount } from 'app/constants'
import { Skeleton } from 'mrooi'

import { Reload } from './Reload'
import { RoowardClaimRow } from './RoowardClaimRow'

import { useRoowardClaimRowStyles } from './RoowardClaimRow.styles'

export const useRoowardsContentStyles = makeStyles(theme =>
  createStyles({
    RoowardsContent: {
      display: 'flex',
      height: '100%',
      padding: theme.spacing(1.5),
      borderRadius: '12px',
      backgroundColor: uiTheme.palette.neutral[800],
    },

    RoowardDialogClaimRowContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      borderRadius: '12px',
      overflow: 'auto',
      height: '100%',
      width: '100%',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },
    },

    RoowardsSkeletons__topContainer: {
      display: 'flex',
      gap: theme.spacing(2),
      height: '88px',
    },

    RoowardsSkeletons__rightContainer: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    },

    RoowardsSkeletons__bottomContainer: {
      display: 'flex',
    },
  }),
)

export const RoowardsContent: React.FC = () => {
  const classes = useRoowardsContentStyles()
  const roowardsClaimRowClasses = useRoowardClaimRowStyles({})
  const { loading, rewards, hasReload, refetch } = useRoowards()

  const [claimedAmount, setClaimedAmount] = React.useState<number | null>(null)
  const [claimedInfo, setClaimedInfo] = React.useState(null)

  const trail = useTrail(rewards.length, {
    config: config.wobbly,
    opacity: loading ? 0 : 1,
    transform: loading ? 'translate3d(-10px, 0, 0)' : 'translate3d(0px, 0, 0)',

    from: {
      opacity: 0,
      transform: 'translate3d(-10px, 0, 0)',
    },
  })

  React.useEffect(() => {
    refetch()
  }, [])

  const totalWagered = useSelector(({ user }) => {
    let hiddenTotalBet = user.hiddenTotalBet

    if (user.roowardsBonus) {
      if (user.roowardsBonus === true) {
        hiddenTotalBet += RoowardsBonusAmount
      } else if (user.roowardsBonus > 1) {
        hiddenTotalBet += user.roowardsBonus
      }
    }

    return Math.max(0, hiddenTotalBet)
  })

  const setClaimResponse = React.useCallback((claimedInfo, claimedAmount) => {
    setClaimedInfo(claimedInfo)
    setClaimedAmount(claimedAmount)
  }, [])

  return (
    <div className={classes.RoowardsContent}>
      <div className={classes.RoowardDialogClaimRowContainer}>
        {hasReload && <Reload setClaimResponse={setClaimResponse} />}
        {!loading
          ? trail.map((props, i) => (
              <animated.div key={rewards[i].type} style={props}>
                <RoowardClaimRow
                  setClaimResponse={setClaimResponse}
                  totalWagered={totalWagered}
                  reward={rewards[i]}
                />
              </animated.div>
            ))
          : Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={roowardsClaimRowClasses.RoowardsDialog__rewardItem}
              >
                <div className={classes.RoowardsSkeletons__topContainer}>
                  <Skeleton
                    variant="rectangular"
                    width={88}
                    height={88}
                    animation="wave"
                  />
                  <div className={classes.RoowardsSkeletons__rightContainer}>
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={24}
                      animation="wave"
                    />
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height={64}
                      animation="wave"
                    />
                  </div>
                </div>
                <div className={classes.RoowardsSkeletons__bottomContainer}>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={44}
                    animation="wave"
                  />
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
