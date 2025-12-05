import React from 'react'
import ReactJson from 'react-json-view'
import { Card, CardContent, Button, Typography } from '@mui/material'
import clsx from 'clsx'

import { api } from 'common/util'
import { env } from 'common/constants'
import { useDarkMode } from 'admin/context'
import { useConfirm } from 'common/hooks'

import { SetSelfCxAffId } from './SetSelfCxAffId'
import { type UserData } from '../../types'

import { useAffiliateStyles } from './Affiliate.styles'

interface AffiliateProps {
  userData: UserData
  refreshSession: () => void
}

export const Affiliate: React.FC<AffiliateProps> = ({
  userData,
  refreshSession,
}) => {
  const classes = useAffiliateStyles()
  const [isDarkMode] = useDarkMode()
  const confirm = useConfirm()

  const { refs, ...affiliate } = userData.affiliate
  const userId = userData.user.id

  const generateAffiliateStatsToken = async userId => {
    const res = await api.get<unknown, string>(
      `/affiliate/token?userId=${userId}`,
    )

    try {
      await confirm({
        title: 'AffiliateToken',
        message: res,
      })
    } catch {}
  }

  const generateTippingStatsToken = async userId => {
    const res = await api.get<unknown, string>(
      `/tipping/token?userId=${userId}`,
    )

    try {
      await confirm({
        title: 'Tipping Token',
        message: res,
      })
    } catch {}
  }

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography variant="h3" className={classes.title}>
          Affiliate
        </Typography>
        <div className={classes.sections}>
          <div className={classes.section}>
            <Typography variant="h4">Actions</Typography>
            <Button
              className={classes.actionButton}
              onClick={() => generateAffiliateStatsToken(userId)}
              variant="contained"
            >
              Generate Affiliate Stats API Token
            </Button>
            <Button
              className={classes.actionButton}
              onClick={() =>
                window.location.assign(
                  `${env.API_URL}/admin/user/getAffiliates?userId=${userId}`,
                )
              }
              variant="contained"
            >
              Download All Affiliates
            </Button>
          </div>
          <div className={classes.section}>
            <Typography variant="h4">Affiliate&apos;s cxAffId</Typography>
            <SetSelfCxAffId
              userId={userId}
              value={affiliate.selfCxAffId}
              reload={refreshSession}
            />
          </div>

          <div className={classes.section}>
            <Typography variant="h4">Tipping</Typography>
            <Button
              className={classes.actionButton}
              onClick={() => generateTippingStatsToken(userId)}
              variant="contained"
            >
              Generate Tipping API Token
            </Button>
          </div>

          <div className={clsx(classes.section, classes.fullWidth)}>
            <Typography variant="h4">Data</Typography>
            <ReactJson
              theme={isDarkMode ? 'monokai' : undefined}
              name="Affiliate"
              src={affiliate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
