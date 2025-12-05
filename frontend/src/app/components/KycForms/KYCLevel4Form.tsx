import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'

import { type User } from 'common/types'
import { FileUpload } from 'mrooi'

import { type KYCFormProps } from './types'
import { getLevelStatus } from './helpers'

import { useKycFormsStyles } from './KycForms.styles'

export const KYCLevel4Form: React.FC<KYCFormProps> = ({ kyc, proceed }) => {
  const classes = useKycFormsStyles()
  const user = useSelector(({ user }: { user?: User }) => user, shallowEqual)

  const status = React.useMemo(() => getLevelStatus(4, kyc), [kyc])

  const canVerify = status === 'incomplete' || status === 'rejected'

  return (
    <>
      <FileUpload
        disabled={!canVerify}
        endpoint="account/uploadDocument"
        acceptedFiles={['image/png', 'image/jpeg', '.pdf']}
        extraFormData={{
          documentType: 'sof',
        }}
        onCompleted={proceed}
        prependFileName="sof"
        userId={user?.id}
      />
    </>
  )
}
