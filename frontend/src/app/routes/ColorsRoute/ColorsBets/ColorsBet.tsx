import React from 'react'
import clsx from 'clsx'
import { useSelector } from 'react-redux'

import black from 'assets/images/colors-black.svg'
import red from 'assets/images/colors-red.svg'
import gold from 'assets/images/colors-gold.svg'
import { getWalletImageUri } from 'app/util'
import { useTranslate } from 'app/hooks'
import { ProfileName } from 'app/components'
import { type User, type BalanceType } from 'common/types'
import { Currency } from 'app/components/DisplayCurrency'

import style from './style.scss'

interface ColorsBetProps {
  balanceType: BalanceType
  gameOver: boolean
  user: User
  betAmount: number
  betSelection: number
  winningNumber: number
  incognito: boolean
}

const getColor = number => {
  if (number === 1) {
    return red
  }
  if (number === 2) {
    return black
  }
  if (number === 3) {
    return gold
  }
}

const ColorsBet: React.FC<ColorsBetProps> = ({
  balanceType,
  gameOver,
  user,
  betAmount,
  betSelection,
  winningNumber,
  incognito,
}) => {
  const translate = useTranslate()
  const userName = useSelector(({ user }) => user?.name)
  const payoutValue = betAmount * (betSelection === 3 ? 14 : 2)
  const won = gameOver && winningNumber === betSelection
  const lost = gameOver && winningNumber !== betSelection
  const cl = clsx(style.colorsBet, {
    [style.won]: won,
    [style.lost]: lost,
    [style.red]: betSelection === 1,
    [style.black]: betSelection === 2,
    [style.gold]: betSelection === 3,
  })

  return (
    <div className={cl}>
      <div className={style.flipper}>
        <div className={style.front}>
          <div className={style.betChoice}>
            <img alt="" src={getColor(betSelection)} />
          </div>
          {!incognito && (
            <div className={style.name}>
              <ProfileName
                mod={user.mod}
                userName={user.name}
                name={user.name === 'Demo' ? userName : null}
                showLabel={false}
              />
            </div>
          )}
          {incognito && (
            <div className={clsx(style.name, style.hidden)}>
              {translate('colorsBets.hidden')}
            </div>
          )}
          <div className={style.wagerAmount}>
            <Currency amount={betAmount} format="0,0.00" />
            <img
              alt=""
              style={{ marginLeft: 5, marginBottom: -2, height: 14 }}
              src={getWalletImageUri(balanceType)}
            />
          </div>
        </div>
        <div className={style.back}>
          <div className={style.betChoice}>
            <img alt="" src={getColor(betSelection)} />
          </div>
          {!incognito && (
            <div className={style.name}>
              <ProfileName
                userName={user.name}
                name={user.name === 'Demo' ? userName : null}
                showLabel={false}
              />
            </div>
          )}
          {incognito && (
            <div className={clsx(style.name, style.hidden)}>
              {translate('colorsBets.hidden')}
            </div>
          )}
          {!lost ? (
            <div className={style.wagerAmount}>
              + <Currency amount={payoutValue} format="0,0.00" />
              <img
                alt=""
                style={{ marginLeft: 5, marginBottom: -2, height: 14 }}
                src={getWalletImageUri(balanceType)}
              />
            </div>
          ) : (
            <div className={style.wagerAmount}>
              - <Currency amount={betAmount} format="0,0.00" />
              <img
                alt=""
                style={{ marginLeft: 5, marginBottom: -2, height: 14 }}
                src={getWalletImageUri(balanceType)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ColorsBet
