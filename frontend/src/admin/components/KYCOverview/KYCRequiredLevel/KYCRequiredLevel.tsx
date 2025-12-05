import React from 'react'

import { useToasts, useAxiosPost, useConfirm } from 'common/hooks'
import { useAccessControl } from 'admin/hooks'
import {
  type KYCRecord,
  type KYCLevel,
  type User,
  OTHER_REASON,
} from 'common/types'
import { KYC_LEVELS } from 'admin/constants'
import { buildSelectOptions } from 'admin/routes/UsersRoute/UserLayouts/OverviewViewTypes/balanceChanges'

import { KYCLevelBaseContainer } from '../KYCLevelBaseContainer'

const KYCRequiredLevelReasons = [
  'KYC Level 1 - RT',
  'KYC Level 2 - RT',
  'Responsible Gambling',
  'Fraud',
  'Linked Account',
  OTHER_REASON,
]

interface KYCRequiredLevelProps {
  userId: User['id']
  reloadKYC: () => void
  kycLevel: KYCLevel
  kycRequiredReason: KYCRecord['kycRequiredReason']
  kycRestrictAccount: KYCRecord['kycRestrictAccount']
}

export const KYCRequiredLevel: React.FC<KYCRequiredLevelProps> = ({
  userId,
  reloadKYC,
  kycLevel,
  kycRequiredReason,
  kycRestrictAccount,
}) => {
  const { toast } = useToasts()
  const { hasAccess: hasKYCAccess } = useAccessControl(['kyc:read'])
  const confirm = useConfirm()

  const [setKYCLevelRequired] = useAxiosPost(
    'admin/users/requiredKYCLevelForUser',
    {
      onCompleted: () => {
        toast.success(`Successfully set required KYC level for ${userId}.`)
        reloadKYC()
      },
      onError: err => {
        toast.error(`Set KYC required level failed: ${err.message}`)
      },
    },
  )

  const handleButtonClick = async (kycRequiredLevel: KYCLevel) => {
    await confirm<{
      kycRequiredReason: string
      kycRestrictAccount: boolean
      other?: string
    }>({
      title: 'KYC Required Level',
      message: `Setting users KYC Required Level to ${kycRequiredLevel}`,
      inputs: [
        {
          type: 'select',
          key: 'kycRequiredReason',
          name: 'KYC Required Reason',
          options: buildSelectOptions(KYCRequiredLevelReasons),
          required: true,
        },
        {
          type: 'text',
          key: 'other',
          name: 'Specified Reason (Other)',
          required: false,
        },
        {
          type: 'checkbox',
          key: 'kycRestrictAccount',
          name: 'Restrict Account',
          required: false,
          defaultValue: kycRestrictAccount,
        },
      ],
    })
      .then(async params => {
        if (params.kycRequiredReason === OTHER_REASON) {
          if (!params.other || params.other.length < 1) {
            toast.error(
              'Reason must be specified. If you selected other, please add a specific reason.',
            )
            return
          }
          params.kycRequiredReason = params.other
          delete params.other
        }
        await setKYCLevelRequired({
          variables: {
            userId,
            kycRequiredLevel,
            kycRequiredReason: params.kycRequiredReason,
            kycRestrictAccount: params.kycRestrictAccount,
          },
        })
      })
      .catch(err => {
        if (err) {
          toast.error(err.message)
        }
      })
  }

  if (!hasKYCAccess) {
    return null
  }

  return (
    <KYCLevelBaseContainer
      title="KYC Required Level"
      buttonText="Set"
      onClick={handleButtonClick}
      initialKycLevel={kycLevel}
      kycLevelOptions={[0, ...KYC_LEVELS]}
      errorMessage={kycRequiredReason && `Reason: ${kycRequiredReason}`}
    />
  )
}
