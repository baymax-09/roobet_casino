import React from 'react'
import { useSelector } from 'react-redux'
import numeral from 'numeral'
import { useMediaQuery, ClickAwayListener } from '@mui/material'
import { Button, Tooltip, theme as uiTheme } from '@project-atl/ui'

import { api } from 'common/util'
import {
  useCurrencyDisplay,
  useTranslate,
  useCurrencyFormatter,
} from 'app/hooks'
import { Currency } from 'app/components/DisplayCurrency'
import { type Campaign } from 'common/types'

import { AffiliateTier } from './AffiliateTier'
import { AffiliateStat } from './AffiliateStat'

import { useAffiliateStatsStyles } from './AffiliateStats.styles'

interface AffiliateStatsProps {
  loading: boolean
  campaign: Campaign | null
}
export const AffiliateStats: React.FC<AffiliateStatsProps> = React.memo(
  ({ loading, campaign }) => {
    const classes = useAffiliateStatsStyles()
    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      {
        noSsr: true,
      },
    )

    const translate = useTranslate()
    const displayCurrencyExchange = useCurrencyDisplay()
    const formatter = useCurrencyFormatter()
    const [tooltipMessage, setTooltipMessage] = React.useState(null)
    const [busy, setBusy] = React.useState(false)
    const [claimed, setClaimed] = React.useState(false)
    const [open, setOpen] = React.useState(false)
    const availableEarnings = useSelector(({ user }) =>
      user ? user.affiliateUnpaid || 0 : 0,
    )

    const handleTooltipClose = React.useCallback(() => {
      setOpen(false)
    }, [])

    const onClaim = React.useCallback(() => {
      setBusy(true)
      setClaimed(false)

      api.get('/affiliate/claim').then(
        () => {
          setBusy(false)
          setClaimed(true)
          setTooltipMessage(translate('affiliateStats.earningsAddedText'))
          setOpen(true)
        },
        err => {
          setTooltipMessage(err.response ? err.response.data : err.message)
          setBusy(false)
          setOpen(true)
        },
      )
    }, [])

    const exchangedEarnings = displayCurrencyExchange(availableEarnings)

    const amountIsZero =
      (exchangedEarnings.exchangedAmount ?? 0) === 0 || claimed

    const buttonText = React.useMemo(() => {
      if (tooltipMessage && open && !claimed) {
        return translate('affiliateStats.holdOn')
      }

      return translate('affiliateStats.claim')
    }, [
      amountIsZero,
      exchangedEarnings.currencySymbol,
      tooltipMessage,
      exchangedEarnings.exchangedAmount,
      open,
      translate,
    ])

    return (
      <>
        <div className={classes.AffiliateStatsTopBlockWrapper}>
          <AffiliateStat
            className={classes.AffiliateStatsTopBlockWrapper__item}
            loading={loading}
            stats={[
              {
                headerText: translate('affiliateStats.availableCredit'),
                stat: <Currency amount={availableEarnings} format="0,0.00" />,
                claimbutton: (
                  <ClickAwayListener onClickAway={handleTooltipClose}>
                    <div className={classes.TooltipContainer}>
                      <Tooltip
                        title={tooltipMessage}
                        onClose={handleTooltipClose}
                        open={open}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        placement={isTabletOrDesktop ? 'top' : 'bottom'}
                      >
                        <div>
                          <Button
                            className={classes.ClaimEarningsButton}
                            {...(!isTabletOrDesktop && { fullWidth: true })}
                            size="large"
                            variant="contained"
                            color="primary"
                            onClick={onClaim}
                            loading={busy}
                            disabled={busy || loading || amountIsZero}
                            label={buttonText}
                            borderOutline
                          />
                        </div>
                      </Tooltip>
                    </div>
                  </ClickAwayListener>
                ),
              },
              {
                headerText: translate('affiliateStats.lifetimeEarnings'),
                stat: (
                  <Currency
                    amount={campaign?.earnedTotal ?? 0}
                    format="0,0.00"
                  />
                ),
              },
            ]}
          />
          <AffiliateTier campaign={campaign} loading={loading} />
        </div>
        <AffiliateStat
          loading={loading}
          stats={[
            {
              headerText: translate('affiliateStats.referrals'),
              stat: numeral(campaign?.referralCount).format('0,0'),
            },
            {
              headerText: translate('affiliateStats.depositors'),
              stat: numeral(campaign?.newDepositorCount).format('0,0'),
            },
            {
              headerText: translate('affiliateStats.deposits'),
              stat: numeral(campaign?.depositCount).format('0,0'),
            },
          ]}
          rowOrColumn="row"
        />
      </>
    )
  },
)

AffiliateStats.displayName = 'AffiliateStats'
