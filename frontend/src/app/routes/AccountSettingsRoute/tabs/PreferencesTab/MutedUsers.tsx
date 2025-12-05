import React from 'react'
import { useSelector } from 'react-redux'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import { UnMute } from '@project-atl/ui/assets'

import { userMute } from 'app/lib/user'
import { useTranslate } from 'app/hooks'

export const useMutedUsersStyles = makeStyles(() =>
  createStyles({
    UserMutedRow: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingBottom: uiTheme.spacing(0.75),
      borderBottom: `2px solid ${uiTheme.palette.neutral[700]}`,
      boxSizing: 'border-box',
      alignItems: 'center',
      width: '100%',
      height: '44px',
    },

    MutedUserList: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
      maxHeight: '492px',
      overflow: 'auto',
      width: '100%',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
      },
    },
    UnMuteIcon: {
      '& .Ui-fill': {
        fill: 'currentColor !important',
      },
    },
  }),
)

export const MutedUsers: React.FC = React.memo(() => {
  const translate = useTranslate()
  const classes = useMutedUsersStyles()

  const [mutingUserId, setMutingUserId] = React.useState('')

  /**
   * @todo: Implement a way of making a flat comparison here with the generated object if re-renders become problematic.
   * Possibly just sorting the mute ids and making a comparison between stringified arrays.
   * shallowEqual will not work here.
   */
  const mutes = useSelector(({ user }) => {
    return Object.keys(user?.mutes ?? {}).map(id => ({
      id,
      ...user.mutes[id],
    }))
  })

  const deleteMute = React.useCallback(
    id => {
      setMutingUserId(id)

      userMute(id, false).then(
        () => {
          setMutingUserId('')
        },
        () => {
          setMutingUserId('')
        },
      )
    },
    [setMutingUserId],
  )

  return (
    <>
      {!mutes.length && (
        <Typography
          variant="body2"
          color={uiTheme.palette.neutral[300]}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {translate('preferencesTab.noBlocksText')}
        </Typography>
      )}

      {mutes && mutes.length > 0 && (
        <div className={classes.MutedUserList}>
          {mutes.map(mute => (
            <div key={mute.id} className={classes.UserMutedRow}>
              <Typography
                variant="body2"
                color={uiTheme.palette.neutral[400]}
                fontWeight={uiTheme.typography.fontWeightMedium}
              >
                {mute.name}
              </Typography>
              <Button
                className={classes.UnMuteIcon}
                disabled={mutingUserId === mute.id}
                variant="text"
                size="medium"
                label={translate('preferencesTab.unmute')}
                onClick={() => deleteMute(mute.id)}
                startIcon={<UnMute width="1rem" height="1rem" />}
              ></Button>
            </div>
          ))}
        </div>
      )}
    </>
  )
})
