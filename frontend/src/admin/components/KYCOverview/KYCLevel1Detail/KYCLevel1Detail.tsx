import React from 'react'
import { Card, CardContent, Typography, List } from '@mui/material'

import { getLevelStatus } from 'app/components/KycForms/helpers'

import { ManualVerificationToggle, GeoRestrictionToggle } from '../KYCToggles'
import { type KYCGetForUserResponse } from '../types'
import { KYCOverviewListItem } from '../KYCOverviewListItem'

import { useKYCLevel1DetailStyles } from './KYCLevel1Detail.styles'
interface KYCLevel1DetailProps {
  data: KYCGetForUserResponse
  reloadKYC: () => void
}

export const KYCLevel1Detail: React.FC<KYCLevel1DetailProps> = ({
  data,
  reloadKYC,
}) => {
  const classes = useKYCLevel1DetailStyles()

  const verificationLevel1Result =
    data.kyc.validationResults &&
    data.kyc.validationResults.find(result => result.level === 1)

  const checkAndPassFailureMessage = (fieldToCheck: string) => {
    if (verificationLevel1Result?.failures) {
      const failure = verificationLevel1Result.failures.find(
        failure => failure.field === fieldToCheck,
      )
      if (failure) {
        return failure.error
      }
    }
    return undefined
  }

  return (
    <Card>
      <CardContent>
        <Typography
          classes={{ root: classes.KYCLevel1DetailsContainer__header }}
          variant="h6"
          color="textSecondary"
          gutterBottom
        >
          {data.user.id}
          <Typography
            classes={{ root: classes.KYCLevel1DetailsContainer__status }}
          >
            {getLevelStatus(1, data.kyc)}
          </Typography>
        </Typography>
        <div className={classes.KYCLevel1DetailsContainer__list}>
          <List>
            <KYCOverviewListItem
              field="First Name"
              value={data.kyc.firstName}
              failureMessage={checkAndPassFailureMessage('firstName')}
            />
            <KYCOverviewListItem
              field="Last Name"
              value={data.kyc.lastName}
              failureMessage={checkAndPassFailureMessage('lastName')}
            />
            <KYCOverviewListItem
              field="Address Line 1"
              value={data.kyc.addressLine1}
              failureMessage={checkAndPassFailureMessage('addressLine1')}
            />
            <KYCOverviewListItem
              field="Address Line 2"
              value={data.kyc.addressLine2}
              failureMessage={checkAndPassFailureMessage('addressLine2')}
            />
            <KYCOverviewListItem
              field="Address City"
              value={data.kyc.addressCity}
              failureMessage={checkAndPassFailureMessage('addressCity')}
            />
            <KYCOverviewListItem
              field="Address Postal Code"
              value={data.kyc.addressPostalCode}
              failureMessage={checkAndPassFailureMessage('addressPostalCode')}
            />
            <KYCOverviewListItem
              field="Address Province/State"
              value={data.kyc.addressState}
              failureMessage={checkAndPassFailureMessage('addressState')}
            />
            <KYCOverviewListItem
              field="Address Country"
              value={data.kyc.addressCountry}
              failureMessage={checkAndPassFailureMessage('addressCountry')}
            />
            <KYCOverviewListItem
              field="Date of Birth"
              value={data.kyc.dob}
              failureMessage={checkAndPassFailureMessage('dob')}
            />
            <KYCOverviewListItem
              field="Phone Number"
              value={data.kyc.phone}
              failureMessage={checkAndPassFailureMessage('phone')}
            />
          </List>
        </div>
        <div className={classes.KYCLevel1DetailsContainer__toggles}>
          <ManualVerificationToggle
            userId={data.user.id}
            level={1}
            checked={data.kyc.manualLevelVerification?.[1]}
            reloadKYC={reloadKYC}
          />
          <GeoRestrictionToggle
            userId={data.user.id}
            isGeoRestricted={!!data?.kyc?.georestricted}
            reloadKYC={reloadKYC}
          />
        </div>
      </CardContent>
    </Card>
  )
}
