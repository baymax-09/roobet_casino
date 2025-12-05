import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { Logo } from '../Logo'

export const useStyles = makeStyles(() =>
  createStyles({
    logo: {
      display: 'flex',
      justifyContent: 'center',
      padding: '8px 16px 8px 16px',
      width: 400,
      height: 'fit-content',
    },
  }),
)

export const LogoWithClassName: React.FC = () => {
  const classes = useStyles()
  return <Logo className={classes.logo} />
}
