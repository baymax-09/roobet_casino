import React, { type PropsWithChildren } from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

interface InfoBlockProps {
  title: string
  size?: 'small' | 'medium'
}

interface StylesProps {
  size: InfoBlockProps['size']
}

export const useInfoBlockStyles = makeStyles(() =>
  createStyles({
    InfoBlock: ({ size }: StylesProps) => ({
      display: 'flex',
      flexDirection: 'column',
      gap: size === 'medium' ? uiTheme.spacing(1) : uiTheme.spacing(0.5),
      alignItems: 'stretch',

      [uiTheme.breakpoints.up('md')]: {
        gap: size === 'medium' ? uiTheme.spacing(1.5) : uiTheme.spacing(1),
        alignItems: 'flex-start',
      },
    }),
  }),
)

export const InfoBlock: React.FC<PropsWithChildren<InfoBlockProps>> = ({
  title,
  size = 'medium',
  children,
}) => {
  const classes = useInfoBlockStyles({ size })

  return (
    <div className={classes.InfoBlock}>
      <Typography
        variant="body2"
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightBold}
      >
        {title}
      </Typography>
      {children}
    </div>
  )
}
