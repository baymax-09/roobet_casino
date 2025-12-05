import React from 'react'
import { connect } from 'react-redux'
import io from 'socket.io-client'
import numeral from 'numeral'
import moment from 'moment'
import { Helmet } from 'react-helmet'
import Countdown from 'react-countdown'
import { withTranslation } from 'react-i18next'
import { useMediaQuery, Box } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

import {
  setColorsBets,
  updateColorsBets,
  setColorsState,
  setLastColorsPoint,
} from 'app/reducers/colors'
import { env } from 'common/constants'
import { loadSoundScope } from 'app/lib/sound'
import { GameSettings, Leaderboard, RecentlyPlayed } from 'app/components'
import { api } from 'common/util'
import { roundBalance } from 'app/util'
import { NUM_GAMES } from 'app/constants'

import { useGameRouteStyles } from '../GameRoute/GameRoute.styles'
import { ColorsBetControls } from './ColorsBetControls'
import { ColorsHistory } from './ColorsHistory'
import Animation from './Animation'

import style from './style.scss'

const withGameRouteStyle =
  (style: keyof ReturnType<typeof useGameRouteStyles>) =>
  ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const styles = useGameRouteStyles({})

    return (
      <div {...props} className={clsx(styles[style], props.className)}>
        {children}
      </div>
    )
  }

const withIsMobile = <
  C extends React.ComponentType<Record<PropertyKey, unknown>>,
>(
  Component: C,
) => {
  return (props: React.ComponentProps<C>) => {
    const Comp = Component as React.ComponentType<{ isMobile: boolean }>
    const isMobile = useMediaQuery(uiTheme.breakpoints.down('md'), {
      noSsr: true,
    })

    return <Comp isMobile={isMobile} {...props} />
  }
}

const GameRoute = withGameRouteStyle('GameRoute')
const GameRouteContainer = withGameRouteStyle('GameRouteContainer')

/**
 * @note Do not attempt to make me a functional component, it is not worth the risk. Instead, when Roulette is updated,
 * I will most likely be deleted.
 */
class ColorsRouteView extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      previousHash: '',
    }
    this.engine = {
      state: 'Loading',
    }
    this._socket = io(`${env.SOCKET_URL}/roulette`, {
      forceNew: true,
      'force new connection': true,
      transports: ['websocket'],
    })

    this.roulette = React.createRef()

    loadSoundScope('roulette')
  }

  override componentDidMount() {
    this._reload().then(() => {
      this._socket.on('rouletteGameUpdate', update => {
        this._updateGame(update)
      })

      this._socket.on('reconnect', () => {
        this._reload()
      })

      this._socket.on('newRouletteBet', bet => {
        const multiplier = bet.betSelection === 3 ? 14 : 2
        const newBet = {
          betAmount: bet.betAmount,
          won: null, // pending
          payoutMultiplier: multiplier,
          balance: this._walletBalance(),
          balanceType: bet.balanceType,
          profit: null, // pending
          game_name: 'roulette_v1',
          betSelection: bet.betSelection,
        }
        if (!this.lastRouletteBets) {
          this.lastRouletteBets = [newBet]
        } else {
          // check if there is already a bet with the same betSelection value
          const existingBet = this.lastRouletteBets.find(
            b => b.betSelection === bet.betSelection,
          )
          if (existingBet) {
            existingBet.betAmount = bet.betAmount
            existingBet.balance = this._walletBalance()
            existingBet.balanceType = bet.balanceType
          } else {
            this.lastRouletteBets.push(newBet)
          }
        }
        this.props.dispatch(updateColorsBets(bet))
      })
    })
  }

  override componentWillUnmount() {
    this._socket.close()
  }

  override render() {
    const translate = this.props.t
    const { size, colors, user, isMobile } = this.props
    const {
      previousHash,
      payoutDuration,
      payoutEndTime,
      payoutStartTime,
      spinNumber,
      randomNumber,
      winningNumber,
    } = this.state
    const volumeOn = user && user.systemSettings.roulette.volume

    return (
      <>
        <GameRoute className={style.ColorsRoute}>
          <GameRouteContainer>
            <Helmet>
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <title>Roulette</title>
              <meta
                name="description"
                content={translate('gameRoute.description', {
                  title: 'Roulette',
                  provider: 'Roobet',
                  numGames: NUM_GAMES,
                })}
              />
            </Helmet>

            <div className={style.gameContainer}>
              {!isMobile && (
                <section className={style.leftSection}>
                  <ColorsBetControls
                    socket={this._socket}
                    engine={this.engine}
                  />
                </section>
              )}
              {!isMobile && (
                <section className={style.rightSection}>
                  <div className={style.animation}>
                    {this.engine.state === 'Payout' && (
                      <div className={style.countdownContainer}>
                        <div className={style.seconds}>
                          <div className={style.topText}>
                            {translate('colorsRoute.rolling')}
                          </div>
                        </div>
                        <div className={style.countdown}>
                          <div className={style.progress}></div>
                        </div>
                      </div>
                    )}
                    {this.engine.state === 'TakingBets' && (
                      <div className={style.countdownContainer}>
                        <Countdown
                          renderer={props => {
                            return (
                              <div className={style.countdown}>
                                <div className={style.seconds}>
                                  <div className={style.topText}>
                                    {translate('colorsRoute.rollingIn')}{' '}
                                  </div>
                                  {numeral(props.total / 1000).format('0.00')}
                                </div>
                                <div className={style.progress}>
                                  <span
                                    className={style.fill}
                                    style={{
                                      width: `${
                                        (props.total / (14 * 1000)) * 100
                                      }%`,
                                    }}
                                  ></span>
                                </div>
                              </div>
                            )
                          }}
                          precision={4}
                          intervalDelay={10}
                          date={payoutStartTime}
                        />
                      </div>
                    )}
                    {/* TODO: Need to decouple state from presentation for TakingBets and Payout so we can translate */}
                    {this.engine.state !== 'TakingBets' &&
                      this.engine.state !== 'Payout' && (
                        <div className={style.countdownContainer}>
                          <div className={style.seconds}>
                            <div className={style.topText}>
                              {translate('colorsRoute.gameStartingIn')}
                            </div>
                          </div>
                          <div className={style.countdown}>
                            <div className={style.progress}></div>
                          </div>
                        </div>
                      )}

                    <Animation
                      winner={spinNumber}
                      engine={this.engine}
                      offsetSeed={randomNumber}
                      duration={payoutDuration}
                      volume={volumeOn}
                      ref={this.roulette}
                    />
                    <ColorsHistory />
                  </div>
                </section>
              )}

              {isMobile && (
                <section className={style.mobileSection}>
                  {this.engine.state === 'Payout' && (
                    <div className={style.countdownContainer}>
                      <div className={style.seconds}>
                        <div className={style.topText}>
                          {translate('colorsRoute.rolling')}
                        </div>
                      </div>
                      <div className={style.countdown}>
                        <div className={style.progress}></div>
                      </div>
                    </div>
                  )}
                  {this.engine.state === 'TakingBets' && (
                    <div className={style.countdownContainer}>
                      <Countdown
                        renderer={props => (
                          <div className={style.countdown}>
                            <div className={style.seconds}>
                              <div className={style.topText}>
                                {translate('colorsRoute.rollingIn')}{' '}
                              </div>
                              {numeral(props.total / 1000).format('0.00')}
                            </div>
                            <div className={style.progress}>
                              <span
                                className={style.fill}
                                style={{
                                  width: `${
                                    (props.total / (14 * 1000)) * 100
                                  }%`,
                                }}
                              ></span>
                            </div>
                          </div>
                        )}
                        precision={4}
                        intervalDelay={10}
                        date={payoutStartTime}
                      />
                    </div>
                  )}
                  {this.engine.state !== 'TakingBets' &&
                    this.engine.state !== 'Payout' && (
                      <div className={style.countdownContainer}>
                        <div className={style.seconds}>
                          <div className={style.topText}>
                            {translate('colorsRoute.gameStartingIn')}
                          </div>
                        </div>
                        <div className={style.countdown}>
                          <div className={style.progress}></div>
                        </div>
                      </div>
                    )}

                  <div className={style.Anim}>
                    <Animation
                      winner={spinNumber}
                      engine={this.engine}
                      offsetSeed={randomNumber}
                      duration={payoutDuration}
                      volume={volumeOn}
                      ref={this.roulette}
                    />
                  </div>
                  <div className={style.bg}>
                    <ColorsHistory isMobile />
                    <ColorsBetControls
                      socket={this._socket}
                      engine={this.engine}
                      isMobile
                    />
                  </div>
                </section>
              )}
            </div>

            <Box
              sx={{
                px: [2, 2, 0],
              }}
            >
              <GameSettings gameName="roulette" />
            </Box>
            <Box
              sx={{
                padding: [2, 2, 0],
              }}
            >
              <Leaderboard gameId="roulette" />
            </Box>
          </GameRouteContainer>
        </GameRoute>
        <RecentlyPlayed />
      </>
    )
  }

  _reload() {
    this.engine.state = 'Loading'

    return api.get('roulette/getActiveGame').then(({ game, bets }) => {
      this._updateGame(game)
      this.props.dispatch(setColorsBets(bets))
    })
  }

  _updateGame(game) {
    if (game.state === 'TakingBets') {
      this.props.dispatch(setColorsBets([]))
      this.engine.bettingEndTime = game.countdown.bettingEndTime
      this.engine.lastBetSelection = null
    } else if (game.state === 'Payout') {
      this.engine.payoutEndTime = game.countdown.payoutEndTime - 25
      this.engine.winningNumber = game.winningNumber
      this.engine.spinNumber = game.spinNumber
      this.engine.randomNumber = game.randomNumber
      this.setState({
        payoutDuration: game.countdown.payoutEndTime,
        winningNumber: game.winningNumber,
        spinNumber: game.spinNumber,
        randomNumber: game.randomNumber,
      })
      this.roulette.current.start()

      this.lastRouletteBets = []
    } else if (game.state === 'Over') {
      this.props.dispatch(
        setLastColorsPoint({ winningNumber: game.winningNumber, id: game.id }),
      )
    }

    this.setState({
      previousHash: game.previousHash,
      payoutEndTime: moment()
        .add(game.countdown.payoutEndTime, 'ms')
        .toISOString(),
      payoutStartTime: moment()
        .add(game.countdown.payoutStartTime, 'ms')
        .toISOString(),
    })
    this.engine.state = game.state
    this.props.dispatch(setColorsState(game.state))
  }

  _walletBalance() {
    const { balance, balanceType } = this.props

    if (!balanceType) {
      return null
    }

    if (balance < 0.01) {
      return 0
    }

    return roundBalance(balance)
  }
}

export const ColorsRoute = connect(({ colors, user, balances }) => {
  return {
    user,
    colors,
    balance: balances[balances.selectedBalanceType],
    balanceType: balances.selectedBalanceType,
  }
})(withIsMobile(withTranslation()(ColorsRouteView)))
