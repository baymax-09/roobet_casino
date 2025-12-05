import React from 'react'
import { useMediaQuery } from '@mui/material'
import {
  Button,
  Table,
  type RowState,
  type TableBodyRows,
  theme as uiTheme,
} from '@project-atl/ui'

import { useTranslate, useIsLoggedIn, useCurrencyFormatter } from 'app/hooks'
import { type Campaign } from 'common/types'

import { useAffiliateReferralsStyles } from './AffiliateReferrals.styles'

interface AffiliateReferralsProps {
  loading: boolean
  campaign: Campaign | null
  handleReferralHistoryClick: (showTabs: boolean) => void
}

export const AffiliateReferrals: React.FC<AffiliateReferralsProps> = React.memo(
  ({ loading, campaign, handleReferralHistoryClick }) => {
    const translate = useTranslate()
    const classes = useAffiliateReferralsStyles()
    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      {
        noSsr: true,
      },
    )
    const isLoggedIn = useIsLoggedIn()
    const exchangeAndFormatCurrency = useCurrencyFormatter()

    const [rowsState, setRowsState] = React.useState<RowState>({
      page: 0,
      pageSize: 10,
      rows: [],
      rowCount: campaign?.earningsPerUser.length ?? 0,
      loading,
      order: 'desc',
      orderBy: null,
    })

    React.useEffect(() => {
      const earningsPerUser = campaign?.earningsPerUser
      if (earningsPerUser) {
        const rows: TableBodyRows = earningsPerUser.map(
          (earningPerUser, index) => {
            return {
              key: index,
              cells: [
                {
                  key: `name-${index}`,
                  data: earningPerUser.username,
                },
                {
                  key: `commission-${index}`,
                  data: `${translate('affiliateReferral.commissionAmount', {
                    formattedCurrency: exchangeAndFormatCurrency(
                      earningPerUser.sum,
                    ),
                  })}`,
                },
              ],
            }
          },
        )
        setRowsState(prev => ({ ...prev, rows }))
      }
    }, [campaign])

    const columns = React.useMemo(
      () => [
        {
          field: 'username',
          headerName: isTabletOrDesktop
            ? translate('affiliateReferral.username')
            : translate('affiliateReferral.usernameMobile'),
          width: 0.5,
        },
        {
          field: 'commission',
          headerName: isTabletOrDesktop
            ? translate('affiliateReferral.commissionGenerated')
            : translate('affiliateReferral.commissionGeneratedMobile'),
          width: 0.5,
        },
      ],
      [translate, isTabletOrDesktop, campaign?.earningsPerUser],
    )

    return (
      <div className={classes.AffiliateReferrals}>
        {isTabletOrDesktop && (
          <div className={classes.BackToEarningsButtonContainer}>
            <Button
              className={classes.BackToEarningsButton}
              variant="contained"
              color="tertiary"
              size="large"
              onClick={() => handleReferralHistoryClick(true)}
              label={translate('affiliateReferral.backToEarnings')}
            />
          </div>
        )}
        <div className={classes.TableContainer}>
          <Table
            rowsState={rowsState}
            setRowsState={setRowsState}
            noResultsText={translate('table.noResults')}
            blurTable={!isLoggedIn}
            tableHeadProps={{
              columns,
            }}
            tablePaginationProps={{
              locale: {
                pageText: translate('table.page'),
                ofText: translate('table.of'),
              },
            }}
          />
        </div>
      </div>
    )
  },
)

AffiliateReferrals.displayName = 'AffiliateReferrals'
