import React from 'react'
import { useMediaQuery } from '@mui/material'
import Skeleton from '@mui/material/Skeleton'
import {
  Typography,
  Tooltip,
  LinearProgress,
  theme as uiTheme,
} from '@project-atl/ui'
import { Info } from '@project-atl/ui/assets'

import { useTranslate } from 'app/hooks'
import { type Campaign } from 'common/types'

import { AffiliateStat } from './AffiliateStat'

import { useAffiliateTierStyles } from './AffiliateTier.styles'

interface AffiliateTierProps {
  loading: boolean
  campaign: Campaign | null
}

export const AffiliateTier: React.FC<AffiliateTierProps> = React.memo(
  ({ loading, campaign }) => {
    const classes = useAffiliateTierStyles()
    const translate = useTranslate()
    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      {
        noSsr: true,
      },
    )

    const progress = React.useMemo(() => {
      if (!campaign) {
        return 0
      }

      const { next } = campaign.tier

      if (!next) {
        return 100
      }

      const pct1 = Math.min(
        100,
        (campaign.referralCount / next.countRequired) * 100,
      )
      const pct2 = Math.min(
        100,
        (campaign.referralsWagered / next.wagerRequired) * 100,
      )
      return ((pct1 + pct2) / 200) * 100
    }, [campaign])

    const tierProgress = React.useCallback(
      ({ tier, cut }) => (
        <div className={classes.AffiliateTierNextTierProgress}>
          <Typography
            variant="body5"
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {translate('affiliateTier.tier')} {tier}:{' '}
            <Typography
              className={classes.AffiliateTierCommissionProgress__text}
              variant="body5"
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {cut}%
            </Typography>
          </Typography>
        </div>
      ),
      [],
    )

    const current = campaign?.tier.current
    const next = campaign?.tier.next

    return (
      <AffiliateStat
        loading={loading}
        stats={[
          {
            headerText: translate('affiliateTier.commissionTier'),
            rightOfHeader: (
              <div className={classes.AffiliateTierInfo__container}>
                <Tooltip
                  title={translate('affiliateTier.tooltipMessage')}
                  placement={isTabletOrDesktop ? 'top' : 'left'}
                >
                  <div>
                    <Info
                      className={classes.AffiliateTierInfo__icon}
                      iconFill={uiTheme.palette.neutral[500]}
                    />
                  </div>
                </Tooltip>
              </div>
            ),
            stat: `${translate('affiliateTier.tier')} ${current?.tier}`,
            bottomStat: !campaign ? (
              <Skeleton
                className={classes.AffiliateTierCommissionProgress}
                variant="rectangular"
                animation="wave"
                height={55}
              />
            ) : (
              <div className={classes.AffiliateTierCommissionProgress}>
                <Typography
                  className={classes.AffiliateTierCommissionProgress__text}
                  variant="body2"
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {translate('affiliateTier.commissionProgress')}
                </Typography>
                <LinearProgress
                  className={classes.LinearProgress}
                  variant="determinate"
                  value={progress}
                  sx={{ backgroundColor: uiTheme.palette.neutral[900] }}
                />
                <div className={classes.AffiliateTierBottomTiers}>
                  {!!current &&
                    tierProgress({ cut: current.cut, tier: current.tier })}
                  {!!next && tierProgress({ cut: next.cut, tier: next.tier })}
                </div>
              </div>
            ),
          },
        ]}
      />
    )
  },
)

AffiliateTier.displayName = 'AffiliateTier'
