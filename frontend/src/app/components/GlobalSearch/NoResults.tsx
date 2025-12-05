import React from 'react'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { Search } from '@project-atl/ui/assets'

import { useTranslate } from 'app/hooks'

interface NoResultsProps {
  customText?: string
}

export const useNoResultsStyles = makeStyles(theme =>
  createStyles({
    NoResults: {
      display: 'flex',
      justifyContent: 'center',
      gap: theme.spacing(1),
      alignItems: 'center',
    },
  }),
)

export const NoResults: React.FC<NoResultsProps> = ({ customText }) => {
  const classes = useNoResultsStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <div className={classes.NoResults}>
      <Search
        width={20}
        height={20}
        topHalfFill={uiTheme.palette.neutral[400]}
        bottomHalfFill={uiTheme.palette.neutral[400]}
      />
      <Typography
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        color={uiTheme.palette.neutral[500]}
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        {customText ?? translate('globalSearch.noResultsFound')}
      </Typography>
    </div>
  )
}
