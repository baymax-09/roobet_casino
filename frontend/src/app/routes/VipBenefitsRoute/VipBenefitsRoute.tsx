/* eslint-disable i18next/no-literal-string */
import React from 'react'
import { useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { useMediaQuery } from '@mui/material'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { ManagedLegalContent } from 'common/constants'
import { BasicPageContainer } from 'app/components/BasicPage/BasicPage'
import { useAppReady, useTranslate } from 'app/hooks'

import { useLegalContent } from '../Legal/api'

export const VipBenefitsRoute: React.FC = () => {
  const translate = useTranslate()

  const [document, loading] = useLegalContent(
    ManagedLegalContent.VIP_TERMS.name,
  )
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const isVIP = useSelector(({ user }) => user && user.role === 'VIP')
  const isAppReady = useAppReady()

  const title = React.useMemo(() => {
    return (
      <Typography
        variant={isTabletOrDesktop ? 'h4' : 'h5'}
        color="inherit"
        fontWeight="inherit"
      >
        <Typography
          component="span"
          variant="h5"
          color={uiTheme.palette.secondary[500]}
          fontWeight={uiTheme.typography.fontWeightBold}
          fontSize="inherit"
          lineHeight="inherit"
        >
          {translate('vipBenefits.congratulations1')}
        </Typography>{' '}
        {translate('vipBenefits.congratulations2')}
      </Typography>
    )
  }, [])

  if (!isVIP && isAppReady) {
    return <Redirect to="/" />
  }

  return (
    <BasicPageContainer
      title={title}
      helmetTitle={document.title}
      loading={loading}
    >
      <Typography
        fontWeight={uiTheme.typography.fontWeightBold}
        color={`${uiTheme.palette.common.white} !important`}
        variant="h4"
      >
        {translate('vipBenefits.benefitHeader')}
      </Typography>

      <Typography
        fontWeight={uiTheme.typography.fontWeightBold}
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        color={uiTheme.palette.neutral[200]}
      >
        {translate('vipBenefits.benefitDescription')}
      </Typography>
      <ul>
        <li>{translate('vipBenefits.benefitList1')}</li>
        <li>{translate('vipBenefits.benefitList2')}</li>
        <li>{translate('vipBenefits.benefitList3')}</li>
        <li>{translate('vipBenefits.benefitList4')}</li>
        <li>{translate('vipBenefits.benefitList5')}</li>
        <li>{translate('vipBenefits.benefitList6')}</li>
      </ul>
      <p>{translate('vipBenefits.additionalBenefits')}</p>
      <p>{translate('vipBenefits.benefitAdditionalSpins')}</p>
      <p>{translate('vipBenefits.depositRequirements')}</p>

      <Typography
        fontWeight={uiTheme.typography.fontWeightBold}
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        color={uiTheme.palette.neutral[200]}
      >
        {translate('vipBenefits.depositAmountsTier1GamesHeader')}
      </Typography>

      <p>{translate('vipBenefits.depositAmountsTier1Gameslist')}</p>

      <p>{translate('vipBenefits.or')}</p>

      <Typography
        fontWeight={uiTheme.typography.fontWeightBold}
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        color={uiTheme.palette.neutral[200]}
      >
        {translate('vipBenefits.depositsAbove5000')}
      </Typography>
      <p>
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('vipBenefits.tier2')}
        </Typography>
        {'- '}
        {translate('vipBenefits.tier2Description')}
      </p>
      <p>
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('vipBenefits.tier3')}
        </Typography>
        {'- '}
        {translate('vipBenefits.tier3Description')}
      </p>
      <p>
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('vipBenefits.tier4')}
        </Typography>
        {'- '}
        {translate('vipBenefits.tier4Description')}
      </p>

      <p>{translate('vipBenefits.gameOfTheWeekDisclaimer')}</p>
      <span
        dangerouslySetInnerHTML={{
          __html: document.content_html || document.content,
        }}
      />
    </BasicPageContainer>
  )
}
