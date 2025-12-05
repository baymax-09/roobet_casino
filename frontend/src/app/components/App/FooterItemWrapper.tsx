import React, { type PropsWithChildren } from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface FooterItemWrapperProps {
  padding: number
  hoverState?: boolean
}

export const useFooterItemWrapperStyles = makeStyles(theme =>
  createStyles({
    FooterItemWrapper: ({ padding, hoverState }: FooterItemWrapperProps) => ({
      display: 'flex',
      width: 'fit-content',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: theme.spacing(0.5),
      borderRadius: 12,
      padding: theme.spacing(padding),
      background: uiTheme.palette.neutral[800],

      ...(hoverState && {
        '&:hover': {
          background: uiTheme.palette.neutral[700],
        },
      }),
    }),
  }),
)

export const FooterItemWrapper: React.FC<
  PropsWithChildren<FooterItemWrapperProps>
> = ({ padding, hoverState, children }) => {
  const classes = useFooterItemWrapperStyles({ padding, hoverState })

  return <div className={classes.FooterItemWrapper}>{children}</div>
}
