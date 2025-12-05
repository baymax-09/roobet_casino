import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Typography } from '@mui/material'

import { useAxiosGet } from 'common/hooks'
import { KYCOverview } from 'admin/components'
import { type KYCGetForUserResponse } from 'admin/components/KYCOverview/types'

import { type UserData } from '../types'

import { useKYCStyles } from './KYC.styles'

interface KycProps {
  userData: UserData
}

export const Kyc: React.FC<KycProps> = ({ userData }) => {
  const classes = useKYCStyles()

  const [{ data }, reloadKyc] = useAxiosGet<KYCGetForUserResponse>(
    `/admin/kyc/getKYCForUserId?userId=${userData.user.id}`,
  )

  const kycDataLoading = !data

  return (
    <div className={classes.root}>
      <Helmet title="KYC" />

      <div className={classes.content}>
        {kycDataLoading ? (
          <Typography>Loading...</Typography>
        ) : (
          <KYCOverview data={data} reload={reloadKyc} />
        )}
      </div>
    </div>
  )
}
