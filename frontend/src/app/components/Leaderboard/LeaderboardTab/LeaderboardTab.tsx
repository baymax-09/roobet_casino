import React from 'react'
import clsx from 'clsx'
import numeral from 'numeral'
import { Typography, Button, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import { useQuery } from '@apollo/client'

import SilverCoin from 'assets/icons/leaderboard/SilverCoin.svg'
import BronzeCoin from 'assets/icons/leaderboard/BronzeCoin.svg'
import GoldCoin from 'assets/icons/leaderboard/GoldCoin.svg'
import { getWalletImageUri } from 'app/util'
import { useTranslate } from 'app/hooks'
import { Currency } from 'app/components/DisplayCurrency'
import { normalizeGame } from 'app/components/Game'
import { type TPGameData, TPGameQuery } from 'app/gql'
import { Skeleton } from 'mrooi'
import { useApp } from 'app/context'

import { useLeaderboardStyles } from '../Leaderboard.styles'

const formatMult = mult => numeral(mult).format('0,0.00')

const CurrencyIcon = ({ bet }) => {
  const classes = useLeaderboardStyles()
  const balanceType = bet.balanceType || bet.selectedBalanceField

  return (
    <img
      alt={balanceType}
      className={classes.BetDetails__coinIcon}
      src={getWalletImageUri(balanceType)}
    />
  )
}

const COIN_ICONS = [<GoldCoin />, <SilverCoin />, <BronzeCoin />] as const

interface LeaderboardTabProps {
  currentTab: { key: string; name: string }
  bets: any[]
  className: string
  gameId: string
}

const MOCK_BETS = [
  {
    _id: '1',
    user: {
      name: 'user1',
    },
    betAmount: Math.random() * 10000,
    payoutValue: Math.random() * 10000,
    balanceType: 'btc',
  },
  {
    _id: '2',
    user: {
      name: 'user2',
    },
    betAmount: Math.random() * 10000,
    payoutValue: Math.random() * 10000,
    balanceType: 'btc',
  },
  {
    _id: '3',
    user: {
      name: 'user3',
    },
    betAmount: Math.random() * 10000,
    payoutValue: Math.random() * 10000,
    balanceType: 'btc',
  },
]

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  currentTab,
  bets,
  className,
  gameId,
}) => {
  const classes = useLeaderboardStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const { appContainer } = useApp()

  const emptyBets = bets.length === 0
  const showBets = emptyBets ? MOCK_BETS : bets

  // Grab game image, but only show for empty bets
  const { data: gameInfo, loading: gameInfoLoading } = useQuery<TPGameData>(
    TPGameQuery,
    {
      variables: {
        type: !isTabletOrDesktop ? 'mobile' : 'desktop',
        gameIdentifier: gameId,
      },
      skip: !emptyBets,
    },
  )

  const scrollTop = React.useCallback(
    () =>
      appContainer?.scrollTo({
        top: 0,
        behavior: 'smooth',
      }),
    [appContainer],
  )

  const gameImage = React.useMemo(() => {
    return gameInfo?.tpGame
      ? normalizeGame(gameInfo.tpGame, 'game').cachedSquareImage
      : null
  }, [gameInfo?.tpGame])

  return (
    <div className={clsx(classes.ResultRecords, className)}>
      {emptyBets && (
        <div className={classes.EmptyBets__blurredBackground}>
          <div className={classes.EmptyBets__content}>
            {gameInfoLoading ? (
              <Skeleton
                width="2rem"
                height="2rem"
                animation="wave"
                variant="rectangular"
              />
            ) : (
              <div
                className={classes.EmptyBets__gameImage}
                style={{
                  backgroundImage: gameImage ? `url(${gameImage})` : undefined,
                }}
              />
            )}

            <div className={classes.EmptyBets__text}>
              <Typography
                variant="body1"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
                paddingBottom={uiTheme.spacing(0.25)}
              >
                {translate('leaderboard.becomeTheLeader')}
              </Typography>
              <Typography
                component="p"
                variant="body3"
                color={uiTheme.palette.neutral[300]}
                fontWeight={uiTheme.typography.fontWeightMedium}
                textAlign="center"
              >
                {currentTab.key === 'highestWins'
                  ? translate('leaderboard.highestEmpty')
                  : translate('leaderboard.luckiestEmpty')}
              </Typography>
            </div>
            <Button
              color="primary"
              variant="contained"
              onClick={scrollTop}
              label={translate('leaderboard.playNow')}
            />
          </div>
        </div>
      )}
      {showBets.map((bet, index) => {
        return (
          <div key={bet._id} className={classes.WinRecord__container}>
            <div className={classes.WinRecord}>
              <div className={classes.WinRecord__userDetails}>
                {COIN_ICONS[index]}
                <Typography
                  variant="h6"
                  color={uiTheme.palette.neutral[100]}
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {bet.user?.name ?? translate('leaderboard.userHidden')}
                </Typography>
              </div>
              <div className={classes.WinRecord__betDetails}>
                <div className={classes.BetDetails__metric}>
                  <Typography
                    variant="body2"
                    color={uiTheme.palette.neutral[300]}
                    fontWeight={uiTheme.typography.fontWeightMedium}
                  >
                    {translate('leaderboard.wager')}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={uiTheme.palette.common.white}
                    fontWeight={uiTheme.typography.fontWeightMedium}
                    {...(!isTabletOrDesktop && {
                      marginLeft: 'auto',
                    })}
                  >
                    <Currency amount={bet.betAmount} format="0,0.00" />
                  </Typography>
                </div>
                <div
                  className={clsx(classes.BetDetails__metric, {
                    [classes.Metric__spotLight]:
                      currentTab.key === 'highestWins',
                  })}
                >
                  <Typography
                    variant="body2"
                    color={uiTheme.palette.neutral[300]}
                    fontWeight={uiTheme.typography.fontWeightMedium}
                  >
                    {translate('leaderboard.payout')}
                  </Typography>
                  <div className={classes.PayoutContainer}>
                    <Typography
                      variant="body2"
                      color={
                        currentTab.key === 'highestWins'
                          ? uiTheme.palette.success[500]
                          : uiTheme.palette.common.white
                      }
                      fontWeight={uiTheme.typography.fontWeightMedium}
                    >
                      <Currency amount={bet.payoutValue} format="0,0.00" />
                    </Typography>
                    <CurrencyIcon bet={bet} />
                  </div>
                </div>
                <div
                  className={clsx(classes.BetDetails__metric, {
                    [classes.Metric__spotLight]:
                      currentTab.key === 'luckiestWins',
                  })}
                >
                  <Typography
                    variant="body2"
                    color={uiTheme.palette.neutral[300]}
                    fontWeight={uiTheme.typography.fontWeightMedium}
                  >
                    {translate('leaderboard.multiplier')}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      currentTab.key === 'luckiestWins'
                        ? uiTheme.palette.success[500]
                        : uiTheme.palette.common.white
                    }
                    fontWeight={uiTheme.typography.fontWeightMedium}
                    {...(!isTabletOrDesktop && {
                      marginLeft: 'auto',
                    })}
                  >
                    {`${formatMult(bet.mult)}x`}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
