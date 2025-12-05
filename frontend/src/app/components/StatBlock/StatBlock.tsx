import React from 'react'
import clsx from 'clsx'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import Skeleton from '@mui/material/Skeleton'

import { useStatBlockStyles } from './StatBlock.styles'

interface Stat {
  headerText: string
  stat: string | React.ReactNode
  rightOfHeader?: React.ReactNode
  bottomStat?: React.ReactNode
}

interface StatBlockContainerProps {
  rowOrColumn?: 'row' | 'column'
  title?: string
  className?: string
}

interface StatBlockProps extends StatBlockContainerProps {
  loading: boolean
  stats: Stat[]
}

export const StatBlockContainer: React.FC<
  React.PropsWithChildren<StatBlockContainerProps>
> = ({ title, rowOrColumn = 'column', className, children }) => {
  const classes = useStatBlockStyles({ rowOrColumn })

  return (
    <div className={clsx(classes.StatBlock, className)}>
      {title && <div className={classes.StatBlock_title}>{title}</div>}
      {children}
    </div>
  )
}

export const StatBlock: React.FC<StatBlockProps> = props => {
  const { loading, stats, rowOrColumn } = props

  const classes = useStatBlockStyles({ rowOrColumn })

  return (
    <StatBlockContainer {...props}>
      {stats.map(({ headerText, stat, rightOfHeader, bottomStat }) => (
        <div key={headerText} className={classes.StatBlockBlock}>
          <div className={classes.StatBlockHeaderBlock}>
            <Typography
              variant="body4"
              fontWeight={uiTheme.typography.fontWeightBold}
              color={uiTheme.palette.neutral[300]}
            >
              {headerText}
            </Typography>
            {rightOfHeader}
          </div>
          <div className={classes.StatBlockBlock__stat}>
            {loading ? (
              <Skeleton
                height={28}
                width="25%"
                variant="rectangular"
                animation="wave"
              />
            ) : (
              stat
            )}
            {bottomStat}
          </div>
        </div>
      ))}
    </StatBlockContainer>
  )
}
