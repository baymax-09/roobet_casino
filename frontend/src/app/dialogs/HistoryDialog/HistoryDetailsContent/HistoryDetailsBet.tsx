import React from 'react'
import numeral from 'numeral'

import redImage from 'assets/images/colors-red.svg'
import blackImage from 'assets/images/colors-black.svg'
import goldImage from 'assets/images/colors-gold.svg'
import redImageNew from 'assets/images/games/roulette/roulette-red.png'
import blackImageNew from 'assets/images/games/roulette/roulette-purple.png'
import goldImageNew from 'assets/images/games/roulette/roulette-green.png'
import { useCurrencyFormatter, useFeatureFlags, useTranslate } from 'app/hooks'
import { getCachedSrc } from 'common/util'
import { type HouseGame } from 'common/types'

import { HistoryDetailsLine } from './HistoryDetailsLine'
import { Verify } from '../Verify'

export interface BetRow {
  _id: string
  betId: string
  betAmount: number
  gameName: HouseGame
  cashoutCrashPoint: number
  thirdParty: boolean
  betSelection: unknown
}

export const HistoryDetailsBet: React.FC<{ row: BetRow }> = ({ row }) => {
  const translate = useTranslate()
  const exchangeAndFormatCurrency = useCurrencyFormatter()

  const { loading, allowed: newRouletteEnabled } = useFeatureFlags([
    'housegames:roulette',
  ])

  if (loading) {
    return null
  }

  const betAmountFormatted = exchangeAndFormatCurrency(row.betAmount)

  return (
    <>
      <HistoryDetailsLine
        lineKey={translate('historyDialog.betId')}
        value={row._id}
      />
      <HistoryDetailsLine
        lineKey={translate('historyDialog.betAmount')}
        value={betAmountFormatted}
      />
      {row.gameName === 'roulette' && (
        <HistoryDetailsLine
          lineKey={translate('historyDialog.betSelection')}
          value={
            <div style={{ width: 50, paddingTop: '5px' }}>
              {row.betSelection === 1 && (
                <img
                  alt="red"
                  src={
                    newRouletteEnabled
                      ? getCachedSrc({ src: redImageNew })
                      : redImage
                  }
                />
              )}
              {row.betSelection === 2 && (
                <img
                  alt="black"
                  src={
                    newRouletteEnabled
                      ? getCachedSrc({ src: blackImageNew })
                      : blackImage
                  }
                />
              )}
              {row.betSelection === 3 && (
                <img
                  alt="gold"
                  src={
                    newRouletteEnabled
                      ? getCachedSrc({ src: goldImageNew })
                      : goldImage
                  }
                />
              )}
            </div>
          }
        />
      )}
      {row.gameName === 'crash' && row.cashoutCrashPoint && (
        <HistoryDetailsLine
          lineKey={translate('historyDialog.cashoutPoint')}
          value={
            <>
              {numeral(row.cashoutCrashPoint).format(
                '0,0.00',
                // eslint-disable-next-line i18next/no-literal-string
              )}
              x
            </>
          }
        />
      )}
      {!row.thirdParty && <Verify gameName={row.gameName} betId={row.betId} />}
    </>
  )
}
