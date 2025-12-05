import React from 'react'

export const PrivacyRoute = React.lazy(() => {
  return import('./PrivacyRoute').then(({ PrivacyRoute }) => ({
    default: PrivacyRoute,
  }))
})

export const KYCAMLRoute = React.lazy(() => {
  return import('./KYCAMLRoute').then(({ KYCAMLRoute }) => ({
    default: KYCAMLRoute,
  }))
})

export const ResponsibleGamblingRoute = React.lazy(() => {
  return import('./ResponsibleGamblingRoute').then(
    ({ ResponsibleGamblingRoute }) => ({
      default: ResponsibleGamblingRoute,
    }),
  )
})

export const SiteTermsRoute = React.lazy(() => {
  return import('./SiteTermsRoute').then(({ SiteTermsRoute }) => ({
    default: SiteTermsRoute,
  }))
})

export const PromotionTermsRoute = React.lazy(() => {
  return import('./PromotionTermsRoute').then(({ PromotionTermsRoute }) => ({
    default: PromotionTermsRoute,
  }))
})

export const VipBenefitsRoute = React.lazy(() => {
  return import('../VipBenefitsRoute').then(({ VipBenefitsRoute }) => ({
    default: VipBenefitsRoute,
  }))
})

export const SportsbookPolicyRoute = React.lazy(() => {
  return import('./SportsbookPolicyRoute').then(
    ({ SportsbookPolicyRoute }) => ({
      default: SportsbookPolicyRoute,
    }),
  )
})

export const GamePolicyRoute = React.lazy(() => {
  return import('./GamePolicyRoute').then(({ GamePolicyRoute }) => ({
    default: GamePolicyRoute,
  }))
})

export const AboutUsRoute = React.lazy(() => {
  return import('./AboutUsRoute').then(({ AboutUsRoute }) => ({
    default: AboutUsRoute,
  }))
})
