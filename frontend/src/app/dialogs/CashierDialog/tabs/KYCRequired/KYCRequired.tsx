import React from 'react'
import { useSelector } from 'react-redux'

import { store } from 'app/util'
import { setUser } from 'app/reducers/user'
import { KYCLevel1FormRedesign } from 'app/components'
import { useTranslate } from 'app/hooks'

import {
  BlockTemplate,
  DescriptionTemplate,
  TabTemplate,
} from '../../templates'

interface KYCRequiredProps {
  continueText: string
  promptText: string
}

const KYCRequired: React.FC<KYCRequiredProps> = ({
  continueText,
  promptText,
}) => {
  const translate = useTranslate()
  const submitRef = React.useRef<HTMLButtonElement | null>(null)
  const [submitButtonEnabled, setSubmitButtonEnabled] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const [errorMessage, setErrorMessage] = React.useState<string | undefined>()
  const kyc = useSelector(({ user }) => user?.kyc)

  return (
    <TabTemplate
      buttonProps={{
        label: translate(continueText),
        onClick: () => submitRef.current?.click(),
        type: 'submit',
        disabled: !submitButtonEnabled || submitting,
        loading: submitting,
      }}
      {...(!!errorMessage && {
        explainerProps: {
          message: errorMessage,
          error: true,
        },
      })}
    >
      <DescriptionTemplate
        title={translate('withdrawTab.pleaseConfirmIdentity')}
        subtext={translate(promptText)}
      />
      <BlockTemplate>
        <KYCLevel1FormRedesign
          kyc={kyc}
          proceed={() => store.dispatch(setUser({ kycLevel: 1 }))}
          submitRef={submitRef}
          setErrorMessage={setErrorMessage}
          setSubmitButtonEnabled={setSubmitButtonEnabled}
          setSubmitting={setSubmitting}
        />
      </BlockTemplate>
    </TabTemplate>
  )
}

export default React.memo(KYCRequired)
