import React from 'react'
import { useMediaQuery } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import {
  Typography,
  theme as uiTheme,
  type TypographyProps,
} from '@project-atl/ui'

interface BlockContentWithHeaderProps {
  title: string
  goldColorTitle: string
  description: string
  content: React.ReactNode
  titleTypographyProps?: TypographyProps
  descriptionTypographyProps?: TypographyProps
}

export const useBlockContentWithHeaderStyles = makeStyles(() =>
  createStyles({
    BlockContentWithHeader: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      alignItems: 'center',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },
  }),
)

export const BlockContentWithHeader: React.FC<BlockContentWithHeaderProps> = ({
  title,
  goldColorTitle,
  description,
  content,
  titleTypographyProps,
  descriptionTypographyProps,
}) => {
  const classes = useBlockContentWithHeaderStyles()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  return (
    <div className={classes.BlockContentWithHeader}>
      <Typography
        variant={isTabletOrDesktop ? 'h3' : 'h4'}
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightBlack}
        {...titleTypographyProps}
      >
        {title}{' '}
        <Typography
          color={uiTheme.palette.secondary.main}
          fontWeight="inherit"
          fontSize="inherit"
          lineHeight="inherit"
          {...titleTypographyProps}
        >
          {goldColorTitle}
        </Typography>
      </Typography>
      <Typography
        variant={isTabletOrDesktop ? 'h6' : 'body1'}
        color={uiTheme.palette.neutral[200]}
        fontWeight={uiTheme.typography.fontWeightMedium}
        {...descriptionTypographyProps}
      >
        {description}
      </Typography>
      {content}
    </div>
  )
}
