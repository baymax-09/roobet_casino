import React from 'react'
import moment from 'moment'
import { Card, CardContent, Typography, IconButton } from '@mui/material'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { FileCopy } from '@mui/icons-material'

import { useConfirm, useToasts } from 'common/hooks'
import { api, isApiError } from 'common/util'
import { UserNotes } from 'admin/routes/UsersRoute/UserLayouts/UserNotes'
import { type User } from 'common/types'

import { ListOverview, JsonOverview } from '../OverviewViewTypes'
import {
  type BalanceChangeType,
  BALANCE_CHANGE_OPERATIONS,
} from '../OverviewViewTypes/balanceChanges'
import { type UserData } from '../../types'

import { useOverviewStyles } from './Overview.styles'

interface OverviewProps {
  currentUser: User
  userData: UserData
  updateUserData: (userData: UserData) => void
  refreshSession: () => void
  overviewType: 'json' | 'list'
}

export const Overview: React.FC<OverviewProps> = ({
  currentUser,
  userData,
  updateUserData,
  overviewType = 'list',
  refreshSession,
}) => {
  const { user, roowardsLevels, settings } = userData

  const classes = useOverviewStyles()
  const confirm = useConfirm()
  const { toast } = useToasts()

  const [busy, setBusy] = React.useState(false)

  const modifyBalance = (balanceTypeOverride, type: BalanceChangeType) => {
    setBusy(true)

    const config = BALANCE_CHANGE_OPERATIONS[type](balanceTypeOverride)

    return confirm(config.confirmOptions)
      .then(rawParams => {
        const params =
          config.confirmOptions.serializeParams?.(rawParams) ?? rawParams

        if ('reason' in params && !params.reason) {
          toast.error(
            'Reason must be specified. If you selected other, please add a specific reason.',
          )
          return
        }

        return api
          .post(config.endpoint, {
            ...params,
            balanceTypeOverride,
            userId: user.id,
          })
          .then(() => {
            toast.success('Successfully changed balance.')
            refreshSession()
          })
      })
      .catch(err => {
        if (err) {
          toast.error(err.message)
        }
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const editAffiliate = () => {
    confirm<{ affiliateName: string }>({
      title: 'Edit Affiliate',
      message: 'Enter an affiliate name for this User',
      inputs: [
        {
          type: 'text',
          key: 'affiliateName',
          name: 'Affiliate Name',
          defaultValue: '',
        },
      ],
    })
      .then(params =>
        api.post('/admin/users/changeAffiliate', {
          affiliateName: params.affiliateName,
          userId: user.id,
        }),
      )
      .then(() => {
        refreshSession()
        toast.success('Affiliate Updated')
      })
      .catch(err => {
        if (err) {
          toast.error(err.message)
        }
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const clearAffiliate = () => {
    confirm({
      title: 'Clear Affiliate',
      message: "Are you sure you want to clear this user's affiliate?",
    })
      .then(() =>
        api.post('/admin/users/changeAffiliate', {
          userId: user.id,
          clear: true,
        }),
      )
      .then(() => {
        refreshSession()
        toast.success('Affiliate cleared')
      })
      .catch(err => {
        if (err) {
          toast.error(err.message)
        }
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const editRoowardLevel = async ({ rewardType }) => {
    setBusy(true)
    try {
      const roowardConfirm = await confirm<{ level: string }>({
        title: 'Edit Rooward Level',
        message: 'Enter a Rooward level for this user between 0 and 10.',
        inputs: [
          {
            type: 'number',
            key: 'level',
            name: 'Rooward Level',
            defaultValue:
              (roowardsLevels && roowardsLevels?.[rewardType]?.level) || 0,
          },
        ],
      })
      const requestBody = {
        userId: user.id,
        type: rewardType,
        level: Number.parseInt(roowardConfirm.level),
      }
      if (
        !Number.isInteger(requestBody.level) ||
        requestBody.level < 0 ||
        requestBody.level > 10
      ) {
        throw new Error(
          'Invalid Rooward level. Please enter a whole number between 0 and 10.',
        )
      }
      await api.post('/admin/roowards/setRoowardsLevel', requestBody)
      refreshSession()
      toast.success('Rooward Level Updated')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    }
    setBusy(false)
  }

  const editCxdAffiliate = () => {
    confirm<{ refCxAffId: string }>({
      title: 'Edit CXD Affiliate',
      message: 'Edit a CXD affiliate name for this User',
      inputs: [
        {
          type: 'text',
          key: 'refCxAffId',
          name: 'CX Affiliate ID',
          defaultValue: '',
        },
      ],
    })
      .then(params => {
        return api.post('/crm/setCxAffId', {
          refCxAffId: params.refCxAffId,
          userId: user.id,
        })
      })
      .then(() => {
        refreshSession()
        toast.success('CXD Affiliate Updated')
      })
      .catch(err => {
        if (err) {
          toast.error(err.message)
        }
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const editCxd = () => {
    confirm<{ refCxd: string }>({
      title: 'Edit CXD',
      message: 'Edit a CXD ',
      inputs: [
        {
          type: 'text',
          key: 'refCxd',
          name: 'CXD',
          defaultValue: '',
        },
      ],
    })
      .then(params => {
        return api.post('/crm/setCxd', {
          refCxd: params.refCxd,
          userId: user.id,
        })
      })
      .then(() => {
        refreshSession()
        toast.success('CXD Updated')
      })
      .catch(err => {
        if (err) {
          toast.error(err.message)
        }
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const copyUserIdToClipboard = () => {
    // create an invisible textfield and copy the value
    // this is old school but the most supported way of doing this
    const el = document.createElement('textarea')
    el.value = user.id
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)

    toast.success('Copied user ID to clipboard!')
  }

  const viewTypes = {
    list: (
      <ListOverview
        modifyBalance={modifyBalance}
        busy={busy}
        setBusy={setBusy}
        userData={userData}
        updateUserData={updateUserData}
        editRoowardLevel={editRoowardLevel}
        editAffiliate={editAffiliate}
        clearAffiliate={clearAffiliate}
        editCxdAffiliate={editCxdAffiliate}
        editCxd={editCxd}
      />
    ),
    json: <JsonOverview userData={userData} />,
  }

  return (
    <div className={classes.root}>
      <div className={classes.viewContainer}>
        <div className={classes.userDetailsContainer}>
          <Card>
            <CardContent>
              <div className={classes.userIdContainer}>
                <Typography
                  className={classes.title}
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  {/* @ts-expect-error TODO userData can technically be a Rethink user or a Mongo user from archivedUser collection */}
                  {user.id || user._id}
                </Typography>
                <IconButton
                  onClick={copyUserIdToClipboard}
                  size="small"
                  className={classes.copyUserIdButton}
                >
                  <FileCopyIcon />
                </IconButton>
              </div>
              <Typography variant="body2" color="textSecondary">
                {user.email ? (
                  <span>
                    {user.email}
                    <CopyToClipboard text={user.email}>
                      <IconButton
                        onClick={() =>
                          toast.success('Copied Player Email to clipboard!')
                        }
                        size="small"
                        className={classes.copyUserIdButton}
                      >
                        <FileCopy />
                      </IconButton>
                    </CopyToClipboard>
                  </span>
                ) : (
                  'Email has not been set'
                )}{' '}
                | Since {moment(user.createdAt).format('ll')} | Locale:{' '}
                {user.locale || 'en'} | Display Currency:{' '}
                {settings?.currency.displayCurrency || 'USD'}
              </Typography>

              {viewTypes[overviewType]}
            </CardContent>
          </Card>
        </div>
        <div className={classes.userNotesContainer}>
          <UserNotes userData={userData} loggedInUserId={currentUser.id} />
        </div>
      </div>
    </div>
  )
}
