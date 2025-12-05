import React from 'react'
import { connect } from 'react-redux'
import clsx from 'clsx'

import black from 'assets/images/colors-black.svg'
import red from 'assets/images/colors-red.svg'
import gold from 'assets/images/colors-gold.svg'
import { useDialogsOpener } from 'app/hooks'
import { store } from 'app/util'
import { setLastColorsPoints } from 'app/reducers/colors'
import { useAxiosGet } from 'common/hooks'

import style from './style.scss'

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

const ColorsHistoryView = ({ lastColorsPoints, isMobile }) => {
  const openDialog = useDialogsOpener()

  useAxiosGet('/roulette/recentNumbers', {
    onCompleted: (data = []) => {
      store.dispatch(setLastColorsPoints(data.splice(0, 25)))
    },
  })

  return (
    <div className={clsx(style.ColorsHistory, isMobile ? style.mobile : null)}>
      {lastColorsPoints.map((row, idx) => (
        <img
          alt="winning color"
          key={idx}
          onClick={() =>
            openDialog('game', {
              params: { id: row.id, gameName: 'roulette' },
            })
          }
          src={getColor(row.winningNumber)}
          className={clsx(style.tick)}
        />
      ))}
    </div>
  )
}

export const ColorsHistory = connect(({ colors }) => ({
  colors,
  lastColorsPoints: colors.lastColorsPoints,
}))(ColorsHistoryView)
