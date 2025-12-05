import React from 'react'
import clsx from 'clsx'
import { Link, Tooltip, type LinkProps } from '@mui/material'

import { useDialogsOpener, useIsLoggedIn } from 'app/hooks'

import { useProfileNameStyles } from './ProfileName.styles'

interface ProfileNameProps extends LinkProps {
  name?: string
  userName: string
  hasChatModBadge?: boolean
  hasChatDevBadge?: boolean
  mention?: boolean
  addText?: string
}

const ProfileName: React.FC<ProfileNameProps> = ({
  className,
  name = null,
  userName,
  hasChatModBadge = null,
  hasChatDevBadge = null,
  mention = false,
  addText,
  ...props
}) => {
  const classes = useProfileNameStyles()
  const openDialog = useDialogsOpener()
  const isLoggedIn = useIsLoggedIn()

  const profileName = !mention ? name ?? userName : userName

  const onClick = React.useCallback(
    event => {
      event.preventDefault()

      if (!isLoggedIn) {
        openDialog('auth')
        return
      }

      openDialog('profile', {
        params: {
          user: profileName,
        },
      })
    },
    [openDialog, isLoggedIn, profileName],
  )

  return (
    <Link
      underline="none"
      className={clsx(classes.ProfileName, className)}
      sx={{
        color: 'common.white',
      }}
      onClick={onClick}
      href={`/?modal=profile&user=${profileName}`}
      {...props}
    >
      {/** TODO: Change this to Typography body4 once using new UI Repo + MUI V5 */}
      <span className={mention ? 'mention' : ''}>
        {(hasChatModBadge || hasChatDevBadge) && (
          <Tooltip title={hasChatModBadge ? 'Moderator' : 'Developer'}>
            <span className={classes.ProfileName__staffContainer}>
              {hasChatModBadge ? 'M' : 'D'}
            </span>
          </Tooltip>
        )}
        {mention && '@'}
        {profileName}
        {addText && addText}
      </span>
    </Link>
  )
}

export default React.memo(ProfileName)
