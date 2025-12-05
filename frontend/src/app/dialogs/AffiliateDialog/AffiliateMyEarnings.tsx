import React from 'react'
import { useSelector } from 'react-redux'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

import { useDialogsLinkUpdate, useTranslate } from 'app/hooks'
import { type Campaign } from 'common/types'
import { useAxiosGet } from 'common/hooks'

import { AffiliateChart } from './AffiliateChart'
import { AffiliateStats } from './AffiliateStats'
import { AffiliateReferrals } from './AffiliateReferrals'
import { DAYS } from './constants'

import { useAffiliateMyEarningsStyles } from './AffiliateMyEarnings.styles'
import { useAffiliateStatStyles } from './AffiliateStat.styles'

interface AffiliateMyEarningsProps {
  params: {
    days: string
  }
  showReferralHistory: boolean
  handleReferralHistoryClick: (showTabs: boolean) => void
}

export const AffiliateMyEarnings: React.FC<AffiliateMyEarningsProps> =
  React.memo(({ params, showReferralHistory, handleReferralHistoryClick }) => {
    const classes = useAffiliateMyEarningsStyles()
    const statClasses = useAffiliateStatStyles({})
    const translate = useTranslate()

    const userId = useSelector(({ user }) => (user ? user.id : null))

    const [days, setDays] = React.useState(() => {
      if (params.days) {
        const parsed = parseInt(params.days)

        if (DAYS.includes(parsed)) {
          return parsed
        }
      }

      return 7
    })

    const updateLink = React.useCallback(
      link => {
        link.days = days
      },
      [days],
    )

    useDialogsLinkUpdate(updateLink, true)

    const [{ loading, data: campaign }, refetch] = useAxiosGet<
      Campaign,
      { daysAgo: number }
    >('affiliate/get', {
      skip: userId === null,
      params: {
        daysAgo: days,
      },
    })

    React.useEffect(() => {
      if (userId === null) {
        return
      }

      refetch({ daysAgo: days })
    }, [userId, refetch, days])

    return (
      <div
        className={clsx(classes.AffiliateMyEarnings, {
          [classes.AffiliateMyEarnings_removePadding]: showReferralHistory,
        })}
      >
        {showReferralHistory ? (
          <AffiliateReferrals
            loading={loading}
            campaign={campaign}
            handleReferralHistoryClick={handleReferralHistoryClick}
          />
        ) : (
          <>
            <AffiliateStats campaign={campaign} loading={loading} />
            <AffiliateChart
              loading={loading}
              days={days}
              setDays={setDays}
              onRefresh={() => refetch({ daysAgo: days })}
              earningsPerDay={
                loading || !campaign ? [] : campaign.earningsPerDay
              }
            />
            <div className={statClasses.AffiliateStat}>
              <div className={statClasses.AffiliateStatBlock}>
                <div className={classes.AffiliateReferralHistory}>
                  <Typography
                    variant="body2"
                    fontWeight={uiTheme.typography.fontWeightBold}
                  >
                    {translate('affiliateMyEarnings.referralHistory')}
                  </Typography>
                  <Button
                    sx={{ marginLeft: 'auto' }}
                    size="large"
                    variant="contained"
                    color="tertiary"
                    onClick={() => handleReferralHistoryClick(false)}
                    label={translate('affiliateMyEarnings.viewAll')}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  })

AffiliateMyEarnings.displayName = 'AffiliateMyEarnings'
