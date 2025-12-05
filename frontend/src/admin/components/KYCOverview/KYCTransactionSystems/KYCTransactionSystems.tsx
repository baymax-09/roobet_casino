import React from 'react'
import { Paper, Typography } from '@mui/material'

import { useToasts, useAxiosGet } from 'common/hooks'
import { useAccessControl } from 'admin/hooks'

import { KYCOverviewListItem } from '../KYCOverviewListItem'

import { useKYCTransactionSystemsStyles } from './KYCTransactionSystems.styles'

interface KYCRequiredLevelProps {
  userId: string
}

interface KYCTransactionSystemsResponse {
  kycTransactionSystems: Record<string, { enabled: boolean }>
}

export const KYCTransactionSystems: React.FC<KYCRequiredLevelProps> = ({
  userId,
}) => {
  const classes = useKYCTransactionSystemsStyles()
  const { toast } = useToasts()
  const { hasAccess: hasKYCAccess } = useAccessControl(['kyc:read'])

  const [{ data, loading }] = useAxiosGet<KYCTransactionSystemsResponse>(
    `admin/kyc/transactionSystems?userId=${userId}`,
    {
      onError: err => {
        toast.error(`Unable to fetch user kyc systems: ${err.message}`)
      },
    },
  )

  if (!hasKYCAccess) {
    return null
  }

  const systems = data?.kycTransactionSystems ?? {}

  return (
    <Paper className={classes.KYCTransactionSystems} elevation={2}>
      <div className={classes.KYCTransactionSystems__container}>
        <Typography variant="h6">KYC Transaction Systems</Typography>
        <div className={classes.KYCTransactionSystems__container}>
          {!loading &&
            Object.entries(systems).map(([systemName, status]) => (
              <div
                key={systemName}
                className={classes.KYCTransactionSystems__systemItem}
              >
                <KYCOverviewListItem
                  field={systemName}
                  value={status.enabled ? 'Enabled' : 'Disabled'}
                />
              </div>
            ))}
        </div>
      </div>
    </Paper>
  )
}
