import React from 'react'
import clsx from 'clsx'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import Skeleton from '@mui/material/Skeleton'

import { useAffiliateStatStyles } from './AffiliateStat.styles'

interface Stat {
  headerText: string
  stat: string | React.ReactNode
  rightOfHeader?: React.ReactNode
  bottomStat?: React.ReactNode
  claimbutton?: React.ReactNode
}

interface AffiliateStatProps {
  loading: boolean
  stats: Stat[]
  rowOrColumn?: 'row' | 'column'
  className?: string
}

export const AffiliateStat: React.FC<AffiliateStatProps> = React.memo(
  ({ loading, stats, rowOrColumn = 'column', className }) => {
    const classes = useAffiliateStatStyles({ rowOrColumn })

    return (
      <div className={clsx(classes.AffiliateStat, className)}>
        {stats.map(
          ({ headerText, stat, rightOfHeader, bottomStat, claimbutton }) => (
            <div key={headerText} className={classes.AffiliateStatBlock}>
              <div className={classes.AffiliateStatHeaderBlock}>
                <Typography
                  variant="body2"
                  fontWeight={uiTheme.typography.fontWeightBold}
                  color={uiTheme.palette.neutral[300]}
                >
                  {headerText}
                </Typography>
                {rightOfHeader}
              </div>
              <div
                className={clsx(classes.AffiliateStatBlock__stat, {
                  [classes.AffiliateStatBlock__statClaim]:
                    headerText === 'Available Credit',
                })}
              >
                {loading ? (
                  <Skeleton
                    height={36}
                    width="25%"
                    variant="rectangular"
                    animation="wave"
                  />
                ) : (
                  <>
                    <Typography
                      variant="h5"
                      fontWeight={uiTheme.typography.fontWeightBold}
                    >
                      {stat}
                    </Typography>
                    {claimbutton}
                  </>
                )}
                {bottomStat}
              </div>
            </div>
          ),
        )}
      </div>
    )
  },
)

AffiliateStat.displayName = 'AffiliateStat'
