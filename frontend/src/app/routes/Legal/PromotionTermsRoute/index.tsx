import React from 'react'

import { ManagedLegalContent } from 'common/constants'
import { BasicPageContainer } from 'app/components/BasicPage/BasicPage'

import { useLegalContent } from '../api'

export const PromotionTermsRoute: React.FC = () => {
  const [document, loading] = useLegalContent(
    ManagedLegalContent.BONUS_AND_PROMOTION_POLICY.name,
  )

  return (
    <BasicPageContainer title={document.title} loading={loading}>
      <span
        dangerouslySetInnerHTML={{
          __html: document.content_html || document.content,
        }}
      />
    </BasicPageContainer>
  )
}
