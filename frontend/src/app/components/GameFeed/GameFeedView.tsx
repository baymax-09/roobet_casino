import React from 'react'
import { Table, type Column, theme as UITheme, Hidden } from '@project-atl/ui'
import { type TFunction } from 'i18next'
import clsx from 'clsx'
import { useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'

import { useTranslate } from 'app/hooks'
import { type BalanceType } from 'common/types'
import { type NormalizedBet } from 'common/types/bets'
import { getWalletImageUri } from 'app/util'

import { MAX_BETS } from './GameFeedController'
import { ProfileName } from '../ProfileName'
import { GameThumbnailImage } from '../Game/GameThumbnail'
import { Currency } from '../DisplayCurrency'
import { GameLink } from '../Game/GameLink'
import { type _tabs } from './GameFeed'

import { useGameFeedStyles } from './GameFeed.styles'

export interface GameFeedRow {
  game: {
    image?: string
    name: string
  }
  wager: {
    amount: number
    balanceType: BalanceType
  }
  username?: string
  timestamp: Date
  mult: number
  payout: number
}

interface GameFeedViewProps {
  tabKey: (typeof _tabs)[number]['key']
  rows: NormalizedBet[]
  loading: boolean
}

// TODO: The width property should be optional.
const fetchColumns = (
  translate: TFunction,
): Array<Omit<Column, 'width'> & { hideBelow?: 'md' | 'lg' }> => [
  {
    field: 'game',
    headerName: translate('gameFeed.game'),
  },
  {
    field: 'username',
    headerName: translate('gameFeed.user'),
    alignText: 'center',
    hideBelow: 'md',
  },
  {
    field: 'timestamp',
    headerName: translate('gameFeed.time'),
    alignText: 'center',
    hideBelow: 'lg',
  },
  {
    field: 'wager',
    headerName: translate('gameFeed.wager'),
    alignText: 'right',
    hideBelow: 'lg',
  },
  {
    field: 'mult',
    headerName: translate('gameFeed.multiplier'),
    alignText: 'right',
    hideBelow: 'lg',
  },
  {
    field: 'payout',
    headerName: translate('gameFeed.payout'),
    alignText: 'right',
  },
]

export const GameFeedView: React.FC<GameFeedViewProps> = ({
  loading,
  tabKey,
  rows,
}) => {
  const translate = useTranslate()
  const classes = useGameFeedStyles()

  // Currently authenticated username for self-bets.
  const currentUsername = useSelector(({ user }) => user?.name)

  // Breakpoints.
  const mediumDown = useMediaQuery(UITheme.breakpoints.down('md'))
  const largeDown = useMediaQuery(UITheme.breakpoints.down('lg'))

  const columns = React.useMemo(() => {
    let cols = fetchColumns(translate)

    if (mediumDown) {
      cols = cols.filter(col => col.hideBelow !== 'md')
    }

    if (largeDown) {
      cols = cols.filter(col => col.hideBelow !== 'lg')
    }

    return cols.map(col => ({
      ...col,
      width: cols.length / 100,
    }))
  }, [translate, mediumDown, largeDown])

  const formattedRows = React.useMemo(
    () =>
      rows.map(row => {
        const username = tabKey === 'user' ? currentUsername : row.user?.name

        const cells = [
          {
            key: 'game',
            data: (
              <div className={classes.GameFeed__tab_cell}>
                <GameLink
                  game={{
                    identifier: row.gameIdentifier,
                  }}
                  className={classes.GameFeed__tab_link}
                >
                  <div className={classes.GameFeed__tab_gameImage}>
                    <GameThumbnailImage
                      game={{
                        title: row.gameName,
                        identifier: row.gameIdentifier,
                        squareImage: row.game?.squareImage,
                      }}
                    />
                  </div>
                  <span className={classes.GameFeed__tab_gameName}>
                    {row.gameNameDisplay || row.gameName}
                  </span>
                </GameLink>
              </div>
            ),
          },
          {
            key: 'username',
            data: (
              <div
                className={clsx(
                  classes.GameFeed__tab_cell,
                  classes.GameFeed__tab_cell_center,
                  {
                    [classes.GameFeed__tab_cell_user_hidden]: !username,
                  },
                )}
              >
                {username ? (
                  <ProfileName userName={username} />
                ) : (
                  <>
                    <Hidden className={classes.GameFeed__tab_cell_icon} />
                    <span>{translate('generic.hiddenName')}</span>
                  </>
                )}
              </div>
            ),
            alignText: 'center',
          },
          { key: 'timestamp', data: row._timestamp, alignText: 'center' },
          {
            key: 'wager',
            alignText: 'right',
            data: (
              <div
                className={clsx(
                  classes.GameFeed__tab_cell,
                  classes.GameFeed__tab_cell_right,
                )}
              >
                <Currency amount={row.betAmount} />
                <img
                  alt={row.balanceType}
                  className={classes.GameFeed__tab_currency}
                  src={getWalletImageUri(row.balanceType)}
                />
              </div>
            ),
          },
          {
            key: 'mult',
            alignText: 'right',
            data: (
              <span
                className={clsx({
                  [classes.GameFeed__tab_cell_won]: !!row.won,
                  [classes.GameFeed__tab_cell_zero]: !row.won,
                })}
              >
                {row._payout}
              </span>
            ),
          },
          {
            key: 'payout',
            alignText: 'right',
            data: (
              <span
                className={clsx({
                  [classes.GameFeed__tab_cell_won]: !!row.won,
                  [classes.GameFeed__tab_cell_zero]: !row.won,
                })}
              >
                <Currency amount={row.payoutValue} />
              </span>
            ),
          },
        ]

        return {
          key: row._id,
          cells: cells.filter(cell => {
            return columns.find(col => col.field === cell.key)
          }, []),
        }
      }),
    [rows, classes, columns, translate, currentUsername, tabKey],
  )

  return (
    <div className={classes.GameFeed__table}>
      <Table
        noResultsText=""
        rowsState={{
          page: 0,
          rowCount: formattedRows.length,
          pageSize: MAX_BETS,
          orderBy: null,
          order: 'desc',
          rows: formattedRows,
          loading,
        }}
        setRowsState={() => {}}
        tableHeadProps={{
          columns,
        }}
      />
    </div>
  )
}
