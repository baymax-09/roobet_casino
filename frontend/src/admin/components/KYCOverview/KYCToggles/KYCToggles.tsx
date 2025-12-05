import React from 'react'
import { Typography, Switch } from '@mui/material'
import clsx from 'clsx'

import { useAxiosPost, useToasts } from 'common/hooks'
import { type VerifiedKYCLevel } from 'common/types'

import { useKYCToggleStyles } from './KYCToggles.styles'

interface ManualVerificationToggleProps {
  userId: string
  level: VerifiedKYCLevel
  checked: boolean | undefined
  extraClassName?: string
  reloadKYC: () => void
}

export const ManualVerificationToggle: React.FC<
  ManualVerificationToggleProps
> = ({ userId, level, checked, extraClassName, reloadKYC }) => {
  const classes = useKYCToggleStyles()
  const { toast } = useToasts()

  const [setManualLevelVerification] = useAxiosPost(
    'admin/users/manualLevelVerification',
    {
      onCompleted: () => {
        toast.success(
          `Successfully set Manual Verification Level ${level} for ${userId}.`,
        )
        reloadKYC()
      },
      onError: err => {
        toast.error(
          `Set Manual Verification Level ${level} for ${userId} failed: ${err.message}`,
        )
      },
    },
  )

  const handleOnChange = async (_, checked: boolean) => {
    await setManualLevelVerification({
      variables: {
        userId,
        level,
        value: checked,
      },
    })
  }
  return (
    <div className={clsx(classes.KYCToggles__baseToggle, extraClassName)}>
      <Switch
        checked={checked ?? false}
        onChange={handleOnChange}
        color="secondary"
        name="themeSwitch"
      />
      <Typography>Manual Verification</Typography>
    </div>
  )
}

interface GeoRestrictionToggleProps {
  userId: string
  isGeoRestricted: boolean
  reloadKYC: () => void
}

export const GeoRestrictionToggle: React.FC<GeoRestrictionToggleProps> = ({
  userId,
  isGeoRestricted,
  reloadKYC,
}) => {
  const classes = useKYCToggleStyles()
  const { toast } = useToasts()
  const [toggleGeoRestriction] = useAxiosPost(
    'kyc/kycv2/toggleGeoRestriction',
    {
      onCompleted: () => {
        reloadKYC()
      },
      onError: () => {
        toast.error('Failed to toggle Geo Restriction')
      },
    },
  )

  const handleToggle = async () => {
    await toggleGeoRestriction({
      variables: {
        userId,
        isGeoRestricted: !isGeoRestricted,
      },
    })
  }

  return (
    <div className={classes.KYCToggles__baseToggle}>
      <Switch
        checked={!!isGeoRestricted}
        onChange={handleToggle}
        color="secondary"
        name="geoRestrictionSwitch"
      />
      <Typography>Geo Restriction</Typography>
    </div>
  )
}
