import React from 'react'
import { Grid } from '@mui/material'

import { KYCLevel1Detail } from './KYCLevel1Detail'
import { ResetUserKYCLevel } from './ResetUserKYCLevel'
import { KYCLevelDocumentList } from './KYCLevelDocumentList'
import { type KYCGetForUserResponse } from './types'
import { KYCRequiredLevel } from './KYCRequiredLevel'
import { KYCTransactionSystems } from './KYCTransactionSystems'

export interface KYCOverviewProps {
  data: KYCGetForUserResponse
  reload: () => void
}

export const KYCOverview: React.FC<KYCOverviewProps> = ({ data, reload }) => (
  <Grid container spacing={2}>
    <Grid item lg={6} xs={12}>
      <KYCLevel1Detail data={data} reloadKYC={reload} />
      {!data.user.deletedAt && (
        <>
          <ResetUserKYCLevel userId={data.kyc.userId!} reloadKYC={reload} />
          <KYCRequiredLevel
            userId={data.kyc.userId!}
            reloadKYC={reload}
            kycLevel={data.user.kycRequiredLevel ?? 0}
            kycRequiredReason={data.kyc.kycRequiredReason}
            kycRestrictAccount={data.kyc.kycRestrictAccount}
          />
          <KYCTransactionSystems userId={data.kyc.userId!} />
        </>
      )}
    </Grid>
    <Grid item lg={6} xs={12}>
      <KYCLevelDocumentList
        data={data}
        level={2}
        title="ID Verification"
        reloadKYC={reload}
      />
      <KYCLevelDocumentList
        data={data}
        level={3}
        title="Proof of Address"
        reloadKYC={reload}
      />
      <KYCLevelDocumentList
        data={data}
        level={4}
        title="Source of Funds"
        reloadKYC={reload}
      />
    </Grid>
  </Grid>
)
