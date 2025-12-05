import React from 'react'
import numeral from 'numeral'
import { Helmet } from 'react-helmet'
import {
  Table,
  Typography,
  type Column,
  theme as uiTheme,
} from '@project-atl/ui'
import { Hidden } from '@project-atl/ui/assets'
import { useMediaQuery } from '@mui/material'

import {
  useCurrencyFormatter,
  useDialogsLinkUpdate,
  useTranslate,
} from 'app/hooks'
import { type DialogProps } from 'app/types'
import { useAxiosGet } from 'common/hooks'
import { ProfileName, TableCalendarOverlay } from 'app/components'
import { GameLink } from 'app/components/Game/GameLink'
import { GameThumbnailImage } from 'app/components/Game/GameThumbnail'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useKOTHLeaderboardDialogStyles } from './KOTHLeaderboardDialog.styles'

interface KOTHLeaderboardDialogProps {
  DialogProps: DialogProps
  params: {
    koth: string
  }
}

// TODO: use the useKOTH hook in this component for DRYness
export const KOTHLeaderboardDialog: React.FC<KOTHLeaderboardDialogProps> =
  React.memo(({ DialogProps }) => {
    const classes = useKOTHLeaderboardDialogStyles()
    const translate = useTranslate()
    const exchangeAndFormatCurrency = useCurrencyFormatter()

    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      {
        noSsr: true,
      },
    )

    useDialogsLinkUpdate()

    const [rowsState, setRowsState] = React.useState({
      rows: [],
      rowCount: 10,
      loading: false,
      order: 'desc',
      orderBy: null,
    })

    const [whichRoo, setWhichRoo] = React.useState<'astro' | 'king' | null>(
      null,
    )

    const [{ data, loading }, fetchLeaderboardData] = useAxiosGet<any, any>(
      'koth/active',
      {
        lazy: true,
        onCompleted: response => {
          setWhichRoo(response.config.whichRoo)
        },
      },
    )

    const leaderboardData = data?.leaderboard
    const config = data?.config

    const bodyRows = React.useMemo(() => {
      if (leaderboardData) {
        return leaderboardData.map(row => {
          const cells: Array<{ key: string; data: React.ReactNode }> = []
          cells.push({
            key: 'username',
            data: row.user.hidden ? (
              <div className={classes.KothLeaderboard__hidden}>
                <Hidden
                  iconFill={uiTheme.palette.neutral[500]}
                  width="1rem"
                  height="1rem"
                />
                <Typography
                  component="span"
                  variant="body4"
                  color={uiTheme.palette.neutral[500]}
                  fontWeight={uiTheme.typography.fontWeightMedium}
                >
                  {translate('generic.hiddenName')}
                </Typography>
              </div>
            ) : (
              <ProfileName userName={row.user.name} />
            ),
          })
          cells.push({
            key: 'game',
            data: (
              <div className={classes.KothLeaderboard__game}>
                <GameLink
                  game={{
                    identifier: row.gameIdentifier,
                  }}
                  className={classes.KothLeaderboard__game__link}
                >
                  <div className={classes.KothLeaderboard__game__image}>
                    <GameThumbnailImage
                      game={{
                        title: row.gameName,
                        identifier: row.gameIdentifier,
                        squareImage: row?.gameImage,
                      }}
                    />
                  </div>
                  <span className={classes.KothLeaderboard__game__name}>
                    {row.gameName}
                  </span>
                </GameLink>
              </div>
            ),
          })

          cells.push({
            key: 'earnings',
            data: exchangeAndFormatCurrency(row.earnings, '0,0.00'),
          })

          cells.push({
            key: 'multiplier',
            data: `x${numeral(row.gameMult).format('0.00')}`,
          })

          return {
            key: row._id,
            cells,
          }
        })
      }
      return []
    }, [data])

    const columns = React.useMemo((): Column[] => {
      return [
        {
          field: 'username',
          headerName: translate('kothLeaderboard.username'),
          width: 0.25,
        },
        {
          field: 'game',
          headerName: translate('kothLeaderboard.game'),
          width: 0.25,
        },
        {
          field: 'earnings',
          headerName: translate('kothLeaderboard.earnings'),
          width: 0.25,
        },
        {
          field: 'multiplier',
          headerName: translate('kothLeaderboard.multiplier'),
          width: 0.25,
        },
      ]
    }, [])

    React.useEffect(() => {
      if (!DialogProps.open) {
        return
      }

      fetchLeaderboardData()
    }, [fetchLeaderboardData, DialogProps.open])

    return (
      <DialogWithBottomNavigation
        maxWidth="md"
        fullWidth
        title={
          whichRoo === 'astro'
            ? translate('kothLeaderboard.astroRooTop10')
            : translate('kothLeaderboard.kingRooTop10')
        }
        showCloseInTitle={true}
        handleClose={DialogProps.onClose}
        {...DialogProps}
      >
        <Helmet
          title={
            whichRoo === 'astro'
              ? translate('kothLeaderboard.astroRooLeaderboard')
              : translate('kothLeaderboard.kingRooLeaderboard')
          }
        />
        <div className={classes.KothLeaderboard}>
          <Table
            {...(!isTabletOrDesktop && { tableWidth: 802 })}
            rowsState={{ ...rowsState, rows: bodyRows, loading }}
            setRowsState={setRowsState}
            noResultsText={translate('table.noResults')}
            // TODO: Should we blur?
            // blurTable={!isLoggedIn}
            tableHeadProps={{
              columns,
            }}
            {...(leaderboardData &&
              leaderboardData.length === 0 && {
                noResultsNode: (
                  <TableCalendarOverlay
                    calendarDate={config.endDate}
                    header={translate('kothLeaderboard.keepPlaying')}
                    subheader={translate('kothLeaderboard.kingNotCrowned')}
                  />
                ),
              })}
          />
        </div>
      </DialogWithBottomNavigation>
    )
  })
