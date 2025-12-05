import React from 'react'
import { useMutation } from '@apollo/client'

import { ResetKYCLevelMutation } from 'admin/gql'
import { useConfirm, useToasts } from 'common/hooks'
import { VerifiedKYCLevels, type KYCLevel } from 'common/types'

import { KYCLevelBaseContainer } from '../KYCLevelBaseContainer'

interface ResetUserKYCLevelProps {
  userId: string
  reloadKYC: () => void
}

export const ResetUserKYCLevel: React.FC<ResetUserKYCLevelProps> = ({
  userId,
  reloadKYC,
}) => {
  const confirm = useConfirm()
  const { toast } = useToasts()

  const [resetKYCLeveLMutation] = useMutation(ResetKYCLevelMutation, {
    onCompleted: () => {
      toast.success(`Successfully reset KYC level for ${userId}.`)
      reloadKYC()
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const resetKYCLevel = async (level: KYCLevel) => {
    try {
      await confirm({
        title: `Reset User Level ${level}`,
        message:
          'User documents, if applicable, will be archived. Documents cannot be unarchived once archived.',
      })
    } catch {
      return
    }

    await resetKYCLeveLMutation({
      variables: {
        data: {
          userId,
          level,
        },
      },
    })
  }

  return (
    <KYCLevelBaseContainer
      title="Reset KYC Level"
      buttonText="Reset"
      onClick={resetKYCLevel}
      kycLevelOptions={[...VerifiedKYCLevels]}
    />
  )
}
