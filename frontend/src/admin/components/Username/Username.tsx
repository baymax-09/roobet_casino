import React from 'react'
import { Link } from 'react-router-dom'

import { useUsernameStyles } from './Username.styles'

interface UsernameProps {
  username: string
  to?: string
}

export const Username: React.FC<UsernameProps> = ({ username, to }) => {
  const classes = useUsernameStyles()

  return (
    <Link
      className={classes.username}
      to={
        to ??
        `users?userDropdown=overview&index=nameLowercase&key=${username.toLowerCase()}`
      }
    >
      {username}
    </Link>
  )
}
