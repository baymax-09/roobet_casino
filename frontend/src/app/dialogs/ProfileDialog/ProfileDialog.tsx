import React from 'react'
import { Helmet } from 'react-helmet'
import {
  theme as uiTheme,
  type DialogProps as UIDialogProps,
  Hidden,
} from '@project-atl/ui'
import {
  Typography,
  useMediaQuery,
  type DialogProps as MUIDialogProps,
} from '@mui/material'
import clsx from 'clsx'
import Skeleton from '@mui/material/Skeleton'
import moment from 'moment'
import { shallowEqual, useSelector } from 'react-redux'

import { useDialogsLinkUpdate, useTranslate } from 'app/hooks'
import { useAxiosGet, useToasts } from 'common/hooks'
import { Currency } from 'app/components/DisplayCurrency'
import { StatBlock, StatBlockContainer } from 'app/components/StatBlock'
import { RoowardsProgress } from 'app/components'
import { RoowardTimespans, type Level, getRoowardsTitle } from 'app/types'
import { type User } from 'common/types'

import { type PublicProfileRequest, type PublicProfileResponse } from './types'
import { ProfileActions, ProfileCopy } from './ProfileActions'
import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useProfileDialogStyles } from './ProfileDialog.styles'

export interface ProfileDialogProps {
  DialogProps: UIDialogProps & MUIDialogProps
  params: {
    user: string
  }
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  params,
  DialogProps,
}) => {
  const translate = useTranslate()
  const isMobile = useMediaQuery(() => uiTheme.breakpoints.down('md'))
  const { toast } = useToasts()
  const classes = useProfileDialogStyles()

  const authedUser = useSelector(
    ({ user }: { user?: User }) => user,
    shallowEqual,
  )

  // Update URL params when dialog is opened/closed.
  useDialogsLinkUpdate(
    React.useCallback(
      link => {
        link.user = params.user
      },
      [params],
    ),
  )

  const closeDialog = () => {
    if (DialogProps.onClose) {
      DialogProps.onClose({}, 'escapeKeyDown')
    }
  }

  const [{ data: profile, loading }] = useAxiosGet<
    PublicProfileResponse,
    PublicProfileRequest
  >('account/publicProfile', {
    onError: error => {
      toast.error(error)
      closeDialog()
    },
    skip: !params?.user,
    params: {
      nameId: params?.user,
    },
  })

  // We do not display actions for self.
  const isSelf: boolean = !!(
    authedUser &&
    profile &&
    authedUser?.id === profile?.id
  )

  const pageTitle = `${translate('profileModal.profile')} - ${profile?.name}`

  return (
    <>
      <DialogWithBottomNavigation
        handleClose={closeDialog}
        maxWidth="md"
        fullWidth
        showCloseInTitle={true}
        {...DialogProps}
        title={translate('profileModal.title')}
        className={classes.ProfileDialog}
      >
        {profile && <Helmet title={pageTitle} />}
        <div
          className={clsx({
            [classes.ProfileDialog_self]: isSelf,
          })}
        >
          <div className={classes.ProfileDialog__head}>
            <StatBlockContainer
              className={clsx(
                classes.ProfileDialog__section_header,
                classes.ProfileDialog__block,
              )}
            >
              <div className={classes.ProfileDialog__name}>
                {loading ? (
                  <Skeleton
                    height={45}
                    width="75%"
                    variant="rectangular"
                    animation="wave"
                  />
                ) : (
                  <>
                    <Typography variant="h3">{profile?.name}</Typography>
                    <div className={classes.ProfileDialog__joined}>
                      <strong>{translate('profileModal.joinedDate')}</strong>
                      &nbsp;
                      {moment(profile?.createdAt).format('MM/DD/YYYY')}
                    </div>
                  </>
                )}
              </div>
              {!loading && (
                <>
                  <div className={classes.ProfileDialog__copy}>
                    <ProfileCopy profile={profile} />
                  </div>
                  {!isSelf && (
                    <div className={classes.ProfileDialog__actions}>
                      <ProfileActions profile={profile} />
                    </div>
                  )}
                </>
              )}
            </StatBlockContainer>
          </div>
          <div
            className={clsx(classes.ProfileDialog__info, {
              [classes.ProfileDialog__info_blur]: profile?.hidden,
            })}
          >
            {profile?.hidden && (
              <div className={classes.ProfileDialog__info_hidden}>
                <Hidden />
                <Typography variant="h6">
                  {translate('profileModal.hiddenTitle')}
                </Typography>
                <Typography variant="body2">
                  {translate('profileModal.hiddenSubtitle')}
                </Typography>
              </div>
            )}
            <div className={classes.ProfileDialog__section_stats}>
              <StatBlock
                loading={loading}
                title={
                  isMobile ? translate('profileModal.accountStats') : undefined
                }
                stats={[
                  {
                    headerText: translate('profileModal.wagered'),
                    stat: (
                      <Currency
                        amount={profile?.totalBet ?? 0}
                        format="0,0.00"
                      />
                    ),
                  },
                  {
                    headerText: translate('profileModal.bets'),
                    stat: <span>{profile?.totalBets ?? 0}</span>,
                  },
                ]}
              />
            </div>
            <div className={classes.ProfileDialog__section_roowards}>
              <StatBlockContainer
                title={translate('profileModal.roowards')}
                className={classes.ProfileDialog__block}
              >
                <div className={classes.ProfileDialog__roowards_levels}>
                  {RoowardTimespans.map(type => (
                    <div className={classes.ProfileDialog__roowards_level}>
                      <div className={classes.ProfileDialog__roowards_progress}>
                        {loading ? (
                          <Skeleton
                            height={88}
                            width={88}
                            variant="rectangular"
                            animation="wave"
                          />
                        ) : (
                          <RoowardsProgress
                            key={type}
                            reward={{
                              type,
                              level:
                                (profile?.roowardsLevels?.[type] as Level) ?? 0,
                            }}
                          />
                        )}
                      </div>
                      <span>{getRoowardsTitle(type, translate)}</span>
                    </div>
                  ))}
                </div>
              </StatBlockContainer>
            </div>
            <div className={classes.ProfileDialog__section_statsMore}>
              <StatBlock
                loading={loading}
                title={
                  isMobile
                    ? translate('profileModal.accountStatsMore')
                    : undefined
                }
                rowOrColumn={isMobile ? 'column' : 'row'}
                stats={[
                  {
                    headerText: translate('profileModal.wageredAvg'),
                    stat: (
                      <Currency
                        amount={
                          (profile?.totalBets ?? 0) > 0
                            ? (profile?.totalBet ?? 0) /
                              (profile?.totalBets ?? 1)
                            : 0
                        }
                        format="0,0.00"
                      />
                    ),
                  },
                  {
                    headerText: translate('profileModal.totalTipped'),
                    stat: (
                      <Currency
                        amount={profile?.totalTipped ?? 0}
                        format="0,0.00"
                      />
                    ),
                  },
                  {
                    headerText: translate('profileModal.totalRewards'),
                    stat: (
                      <Currency
                        amount={profile?.roowardsClaimed ?? 0}
                        format="0,0.00"
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </DialogWithBottomNavigation>
    </>
  )
}
