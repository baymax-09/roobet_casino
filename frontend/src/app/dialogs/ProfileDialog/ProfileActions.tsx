import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { IconButton, Copy, Button } from '@project-atl/ui'
import {
  NotInterested,
  VolumeOff,
  VolumeOffOutlined,
} from '@mui/icons-material'
import CopyToClipboard from 'react-copy-to-clipboard'
import clsx from 'clsx'

import { chatMute, chatBan, userMute } from 'app/lib/user'
import { useDialogsOpener, useTranslate } from 'app/hooks'
import { type User } from 'common/types'
import { useToasts } from 'common/hooks'

import { type PublicProfileResponse } from './types'

import { useProfileActionsStyles } from './ProfileActions.styles'

interface ProfileActionsProps {
  profile: PublicProfileResponse | null
}

type UserWithMutes = User & {
  mutes?: Record<
    string,
    {
      name: string
    }
  >
}

export const ProfileCopy: React.FC<ProfileActionsProps> = ({ profile }) => {
  const classes = useProfileActionsStyles()
  const translate = useTranslate()
  const { toast } = useToasts()

  return (
    <div className={classes.ProfileActions__group}>
      <CopyToClipboard
        text={'https://roobet.com/?modal=profile&user=' + profile?.name}
        onCopy={() => toast.success(translate('profileModal.copyProfileLink'))}
      >
        <IconButton
          size="medium"
          color="tertiary"
          disabled={!profile}
          className={classes.ProfileActions__button_square}
        >
          <Copy />
        </IconButton>
      </CopyToClipboard>
    </div>
  )
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({ profile }) => {
  const classes = useProfileActionsStyles()
  const translate = useTranslate()
  const openDialog = useDialogsOpener()

  const authedUser = useSelector(
    ({ user }: { user?: UserWithMutes }) => user,
    shallowEqual,
  )

  const isChatMod = authedUser?.isChatMod

  return (
    <div
      className={clsx(classes.ProfileActions, {
        [classes.ProfileActions_mod]: isChatMod,
      })}
    >
      {isChatMod && (
        <div className={classes.ProfileActions__group}>
          <IconButton
            size="medium"
            color="tertiary"
            onClick={async () => await chatMute(profile?.id)}
            className={classes.ProfileActions__button_square}
          >
            <VolumeOffOutlined
              className={classes.ProfileActions__button_error}
            />
          </IconButton>
          <IconButton
            size="medium"
            color="tertiary"
            onClick={async () => await chatBan(profile?.id)}
            className={classes.ProfileActions__button_square}
          >
            <NotInterested className={classes.ProfileActions__button_error} />
          </IconButton>
        </div>
      )}
      {authedUser && profile && (
        <div className={classes.ProfileActions__group}>
          {!authedUser.mutes?.[profile.id] && (
            <Button
              color="tertiary"
              size="medium"
              variant="contained"
              onClick={async () => await userMute(profile?.id, true)}
              className={classes.ProfileActions__button_flat}
              startIcon={<VolumeOffOutlined />}
              label={translate('profileModal.chatMute')}
            />
          )}

          {authedUser.mutes?.[profile.id] && (
            <Button
              disableRipple
              color="secondary"
              size="medium"
              variant="contained"
              onClick={async () => await userMute(profile?.id, false)}
              className={classes.ProfileActions__button_flat}
              startIcon={<VolumeOff />}
              label={translate('profileModal.chatUnmute')}
            />
          )}

          <Button
            disableRipple
            variant="contained"
            color="secondary"
            size="medium"
            label={translate('profileModal.sendTip')}
            onClick={() =>
              openDialog('cashier', {
                params: { tab: 'tip', username: profile.name },
              })
            }
          />
        </div>
      )}
    </div>
  )
}
