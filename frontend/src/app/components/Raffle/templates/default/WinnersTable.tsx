import {
  Table,
  theme as uiTheme,
  type Column,
  type TableBodyRows,
  type RowState,
} from '@project-atl/ui'
import { Hidden, Ticket } from '@project-atl/ui/assets'
import React from 'react'
import numeral from 'numeral'
import { useMediaQuery } from '@mui/material'

import coinBottom from 'assets/images/raffle/default/coinBottom.png'
import coinLeft from 'assets/images/raffle/default/coinLeft.png'
import coinRight from 'assets/images/raffle/default/coinRight.png'
import { useTranslate } from 'app/hooks'
import { ProfileName, TableCalendarOverlay } from 'app/components'
import { convertDateToMonthDayFormat } from 'app/util'
import { getCachedSrc } from 'common/util'

import { type PopulatedRaffle } from '../../types'

import { useWinnersTableStyles } from './WinnersTable.styles'

interface WinnersTableProps {
  showWinners: boolean
  winners: PopulatedRaffle['winners']
  payouts: PopulatedRaffle['payouts']
  endDate: Date
}

export const WinnersTable: React.FC<WinnersTableProps> = ({
  winners,
  showWinners,
  payouts,
  endDate,
}) => {
  const classes = useWinnersTableStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [rowsState, setRowsState] = React.useState<RowState>({
    page: 0,
    pageSize: 100,
    rows: [],
    rowCount: 100,
    loading: false,
    order: 'desc',
    orderBy: null,
  })

  const columns = React.useMemo((): Column[] => {
    return [
      {
        field: 'rank',
        headerName: '',
        width: isTabletOrDesktop ? 0.05 : 0.2,
      },
      {
        field: 'user',
        headerName: translate('raffle.user'),
        width: isTabletOrDesktop ? 0.3 : 0.27,
      },
      {
        field: 'tickets',
        headerName: translate('raffle.tickets'),
        width: isTabletOrDesktop ? 0.55 : 0.27,
      },
      {
        field: 'prize',
        headerName: translate('raffle.prize'),
        width: isTabletOrDesktop ? 0.1 : 0.26,
        alignText: 'right',
      },
    ]
  }, [])

  React.useEffect(() => {
    if (showWinners) {
      const rows: TableBodyRows = winners.map((winner, index) => {
        return {
          key: index,
          cells: [
            {
              key: `rank-${index}`,
              data: (
                <div className={classes.WinnersTable__cell_neutral}>
                  {`${index + 1}.`}
                </div>
              ),
            },
            {
              key: `user-${index}`,
              data:
                winner.user && !winner.user.hidden ? (
                  <ProfileName userName={winner.user.name} />
                ) : (
                  <div className={classes.WinnersTable__cell_neutral}>
                    <Hidden
                      width={16}
                      height={16}
                      iconFill={uiTheme.palette.neutral[500]}
                    />
                    {translate('generic.hiddenName')}
                  </div>
                ),
            },
            {
              key: `tickets-${index}`,
              data: (
                <div className={classes.WinnersTable__cell_ticket}>
                  <Ticket
                    width={16}
                    height={16}
                    iconFill={uiTheme.palette.secondary[500]}
                  />
                  {numeral(
                    winner.tickets ? Math.floor(winner.tickets.tickets) : 1,
                  ).format('0,0')}
                </div>
              ),
            },
            {
              key: `prize-${index}`,
              // TODO: May be wrong
              data: (
                <div className={classes.WinnersTable__cell_prizeAmount}>
                  {typeof payouts[index] === 'number'
                    ? numeral(payouts[index]).format('$0,0.00')
                    : payouts[index]}
                </div>
              ),
            },
          ],
        }
      })
      setRowsState(prev => ({ ...prev, rows }))
      return
    }
    const rows = [...new Array(10)].map((_, index) => {
      return {
        key: index,
        cells: [
          {
            key: `rank-${index}`,
            data: (
              <div className={classes.WinnersTable__cell_neutral}>
                {`${index + 1}.`}
              </div>
            ),
          },
          {
            key: `user-${index}`,
            data: `username${index}`,
          },
          {
            key: `tickets-${index}`,

            data: (
              <div className={classes.WinnersTable__cell_ticket}>
                <Ticket
                  width={16}
                  height={16}
                  iconFill={uiTheme.palette.secondary[500]}
                />
                {numeral(Math.random() * 1000).format('0,0')}
              </div>
            ),
          },
          {
            key: `prize-${index}`,
            data: (
              <div className={classes.WinnersTable__cell_prizeAmount}>
                {numeral(Math.random() * 10000).format('$0,0.00')}
              </div>
            ),
          },
        ],
      }
    })
    setRowsState(prev => ({ ...prev, rows }))
  }, [showWinners, winners])

  return (
    <div className={classes.WinnersTable}>
      <img
        className={classes.WinnersTableIcon__coinBottom}
        alt="gold-coin-1"
        src={getCachedSrc({ src: coinBottom, quality: 85 })}
      />
      <img
        className={classes.WinnersTableIcon__coinLeft}
        alt="gold-coin-2"
        src={getCachedSrc({ src: coinLeft, quality: 85 })}
      />
      <img
        className={classes.WinnersTableIcon__coinRight}
        alt="gold-coin-3"
        src={getCachedSrc({ src: coinRight, quality: 85 })}
      />
      <div className={classes.WinnersTable__tableContainer}>
        <Table
          rowsState={{ ...rowsState }}
          setRowsState={setRowsState}
          noResultsText={translate('table.noResults')}
          tableHeadProps={{
            columns,
            backgroundColor: uiTheme.palette.neutral[600],
            borderBottomColor: uiTheme.palette.neutral[800],
          }}
          blurTable={!showWinners}
          tableBodyProps={{
            muiTableBodyProps: {
              sx: {
                backgroundColor: !showWinners
                  ? '#1E1D3F'
                  : uiTheme.palette.neutral[700],
              },
              ...(!showWinners && {
                children: (
                  <TableCalendarOverlay
                    calendarDate={endDate}
                    header={translate('raffle.drawingOfWinners')}
                    subheader={translate('raffle.winnersWillBeDrawnOn', {
                      date: convertDateToMonthDayFormat(endDate),
                    })}
                  />
                ),
              }),
            },
          }}
          bottomGradientMaskProps={{
            gradientColor: uiTheme.palette.neutral[700],
          }}
        />
      </div>
    </div>
  )
}
