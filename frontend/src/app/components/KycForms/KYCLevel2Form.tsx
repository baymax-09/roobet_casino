import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'

import { type User } from 'common/types'
import { FileUpload } from 'mrooi'

import { getLevelStatus } from './helpers'
import { type KYCFormProps } from './types'

export const KYCLevel2Form: React.FC<KYCFormProps> = ({ kyc, proceed }) => {
  const user = useSelector(({ user }: { user?: User }) => user, shallowEqual)

  const status = React.useMemo(() => getLevelStatus(2, kyc), [kyc])

  const canVerify = status === 'incomplete' || status === 'rejected'

  return (
    <>
      <FileUpload
        disabled={!canVerify}
        endpoint="account/uploadDocument"
        acceptedFiles={['image/png', 'image/jpeg', '.pdf']}
        extraFormData={{
          documentType: 'identity',
        }}
        onCompleted={proceed}
        prependFileName="identity"
        userId={user?.id}
      />
    </>
  )
}
