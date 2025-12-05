import React from 'react'
import { connect } from 'react-redux'
import clsx from 'clsx'
import { withTranslation } from 'react-i18next'

import { withCurrencyHooks } from 'app/components/DisplayCurrency'
import black from 'assets/images/colors-black.svg'
import red from 'assets/images/colors-red.svg'
import gold from 'assets/images/colors-gold.svg'
import { Button, TextField } from 'mrooi'
import {
  roundBalance,
  modifyBet,
  setStorageItem,
  initialBetAmount,
  truncateCurrency,
} from 'app/util'
import { playSound } from 'app/lib/sound'
import { withDialogsOpener } from 'app/hooks'
import { api } from 'common/util'

import { ColorsBets } from '../ColorsBets'

import style from './style.scss'

/**
 * @note Do not attempt to make me a functional component, it is not worth the risk. Instead, when Roulette is updated,
 * I will most likely be deleted.
 */
class ColorsBetControlsView extends React.Component {
  constructor(props) {
    super(props)

    const { balance, displayCurrencyExchange } = this.props

    const { exchangedAmount: initialDisplayAmount } = displayCurrencyExchange(
      initialBetAmount(balance),
    )
    this.state = {
      busy: false,
      userBetAmount: truncateCurrency(initialDisplayAmount, 2),
    }
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

  _handleOnClick = (_, value) => {
    this._modifyBet(value)
    playSound('bet', 'modify')
  }

  override render() {
    const translate = this.props.t
    const { displayCurrencyExchange, currencyFormatter } = this.props
    const { busy, userBetAmount } = this.state

    const { currencySymbol, exchangedAmount: convertedMaxBet } =
      displayCurrencyExchange(this._walletBalance())

    return (
      <div className={style.ColorsBetControls}>
        <div className={style.betAmount}>
          <TextField
            disabled={busy}
            className={clsx(style.betAmount, style.textField)}
            info={translate('colorsBetControls.maxProfitText', {
              convertedMax: currencyFormatter(1000000),
            })}
            prefix={<div className={style.bitcoinIcon}>{currencySymbol}</div>}
            variant="decimal"
            minAmount={0}
            maxAmount={convertedMaxBet}
            value={userBetAmount}
            onChange={userBetAmount => {
              this.setState({ userBetAmount })
            }}
            label={translate('colorsBetControls.betAmount')}
            suffixComponent={
              <div className={style.betModifiers}>
                <Button
                  disabled={busy}
                  className={style.modifier}
                  onClick={this._handleOnClick}
                  type="modifierButton"
                  value={0.5}
                >
                  &frac12;
                </Button>
                <Button
                  disabled={busy}
                  className={style.modifier}
                  onClick={this._handleOnClick}
                  type="modifierButton"
                  value={2}
                  // eslint-disable-next-line i18next/no-literal-string
                >
                  2&times;
                </Button>
                <Button
                  disabled={busy}
                  className={style.modifier}
                  onClick={this._handleOnClick}
                  type="modifierButton"
                  value="max"
                >
                  {translate('colorsBetControls.max')}
                </Button>
              </div>
            }
          />
        </div>

        <div className={style.buttonContainer}>
          <button
            onClick={() => this._onPlaceBet(1)}
            disabled={busy}
            className={clsx(style.placeBet, style.red)}
          >
            <img alt="Red" src={red} />
            {
              // eslint-disable-next-line i18next/no-literal-string
            }
            x2
          </button>
          <button
            onClick={() => this._onPlaceBet(2)}
            disabled={busy}
            className={clsx(style.placeBet, style.black)}
          >
            <img alt="Black" src={black} />
            {
              // eslint-disable-next-line i18next/no-literal-string
            }
            x2
          </button>
          <button
            onClick={() => this._onPlaceBet(3)}
            disabled={busy}
            className={clsx(style.placeBet, style.gold)}
          >
            <img alt="Gold" src={gold} />
            {
              // eslint-disable-next-line i18next/no-literal-string
            }
            x14
          </button>
        </div>

        <div className={style.colorsBets}>
          <ColorsBets engine={this.props.engine} />
        </div>
      </div>
    )
  }

  _modifyBet(modifier) {
    const { balance, displayCurrencyExchange, currencyUnexchange } = this.props
    const { userBetAmount } = this.state
    const functionalBetAmount = currencyUnexchange(userBetAmount)

    const newBetAmount = modifyBet(
      balance,
      functionalBetAmount,
      modifier,
      displayCurrencyExchange,
    )

    this.setState({
      userBetAmount: newBetAmount,
    })
  }

  _onPlaceBet(betSelection) {
    const { user, currencyUnexchange } = this.props
    if (!user) {
      return this.props.openDialog('auth')
    }
    if (!this.state.placingBet) {
      // place bet sound
      playSound('bet', 'place')
    }
    this.setState({
      busy: true,
    })
    this.props.engine.lastBetSelection = betSelection

    const functionalBetAmount = currencyUnexchange(this.state.userBetAmount)

    if (parseFloat(functionalBetAmount) < 0.01) {
      this.setState({
        busy: false,
      })

      this.props.socket._callbacks.$newRouletteBet[0]({
        betSelection,

        balanceType: 'crypto',
        betAmount: 0,
        closedOut: false,
        gameId: 'demo',
        gameName: 'roulette',
        id: 'demo',
        type: 'Cash',
        user: {
          name: 'Demo',
        },
        userId: 'demo',
      })
      return
    }

    api
      .post('/roulette/joinGame', {
        betAmount: parseFloat(functionalBetAmount),
        betSelection,
      })
      .then(
        response => {
          this.setState({
            busy: false,
          })
          setStorageItem('bet:lastBetAmount', functionalBetAmount)
        },
        err => {
          this.setState({
            busy: false,
          })

          if (err.response) {
            window.toast?.error(err.response.data)
          }
        },
      )
  }
}

export const ColorsBetControls = connect(({ colors, user, balances }) => {
  return {
    user,
    colors,
    balanceType: balances.selectedBalanceType,
    balance: balances[balances.selectedBalanceType],
  }
})(
  withDialogsOpener(
    withTranslation()(withCurrencyHooks(ColorsBetControlsView)),
  ),
)
