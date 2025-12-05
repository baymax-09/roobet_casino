import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { Alert, Typography, theme as uiTheme } from '@project-atl/ui'
import { Trans } from 'react-i18next'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import {
  getLevelStatus,
  getStatusMessage,
} from 'app/components/KycForms/helpers'
import { type KYCGet, type VerifiedKYCLevel, type User } from 'common/types'
import { useTranslate } from 'app/hooks'

import { type StepStatusIndicator } from './VerificationTab'
import { STATUS_TO_SEVERITY } from '../constants'

interface KYCFormDataProps {
  currentStepStatusIndicator: StepStatusIndicator
  kyc: KYCGet
  proceed: () => void
}

export const useKYCFormDataStyles = makeStyles(theme =>
  createStyles({
    KYCFormData__item: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1),
      },
    },

    KYCFormData__item_restrictedTerritory: {
      '& > p > strong': {
        color: uiTheme.palette.neutral[200],
        fontWeight: uiTheme.typography.fontWeightBold,
      },
    },
  }),
)

// t('kycForm.sofUploadCta1')
// t('kycForm.level3Cta1')
// t('kycForm.level2Cta1')
// t('kycForm.sofUploadCta2')
// t('kycForm.level3Cta2')
// t('kycForm.level2Cta2')

const getTypographyFromLevel = (level: Omit<VerifiedKYCLevel, 1>) => {
  return (
    <Typography
      component="span"
      variant="body2"
      color={uiTheme.palette.neutral[200]}
      fontWeight={uiTheme.typography.fontWeightBold}
    >
      <Trans
        i18nKey={
          level === 4
            ? 'kycForm.sofUploadCta1'
            : level === 3
              ? 'kycForm.level3Cta1'
              : 'kycForm.level2Cta1'
        }
      />
      <Typography
        component="span"
        variant="inherit"
        color={uiTheme.palette.neutral[400]}
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        <Trans
          i18nKey={
            level === 4
              ? 'kycForm.sofUploadCta2'
              : level === 3
                ? 'kycForm.level3Cta2'
                : 'kycForm.level2Cta2'
          }
        />
      </Typography>
    </Typography>
  )
}

const separateRestrictedCountries = (strings: string[]) => {
  return [strings.slice(0, -1), strings[strings.length - 1]]
}

export const KYCFormData: React.FC<KYCFormDataProps> = ({
  currentStepStatusIndicator,
  kyc,
  proceed,
}) => {
  const classes = useKYCFormDataStyles()
  const user = useSelector(({ user }: { user?: User }) => user, shallowEqual)
  const restrictedCountries = useSelector(
    ({ settings }) => settings?.restrictedCountries,
  )

  const status = React.useMemo(
    () => getLevelStatus(currentStepStatusIndicator.level, kyc),
    [kyc, currentStepStatusIndicator],
  )
  const translate = useTranslate()

  const statusMessage = getStatusMessage({
    status,
    user,
    level: currentStepStatusIndicator.level,
  })

  const canVerify = status === 'incomplete' || status === 'rejected'

  const currentLevel = currentStepStatusIndicator.level

  const textToRender = React.useMemo(() => {
    const [countries1, countries2] = separateRestrictedCountries(
      Object.values(restrictedCountries ?? {}),
    )

    if (currentLevel === 1) {
      return (
        <Typography
          variant="body2"
          fontWeight={uiTheme.typography.fontWeightMedium}
          color={uiTheme.palette.neutral[400]}
        >
          {translate('kycForm.level1Description')}
        </Typography>
      )
    }
    return (
      <>
        {getTypographyFromLevel(currentLevel)}
        <Typography
          className={classes.KYCFormData__item_restrictedTerritory}
          variant="body2"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {translate('kycForm.restrictedTerritories')}
          <Typography
            component="span"
            variant="body2"
            color={uiTheme.palette.neutral[200]}
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {' '}
            {Array.isArray(countries1) ? countries1.join(', ') : countries1}
          </Typography>{' '}
          {translate('kycForm.and')}
          <Typography
            component="span"
            variant="body2"
            color={uiTheme.palette.neutral[200]}
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {' '}
            {countries2}
          </Typography>
          .
        </Typography>
      </>
    )
  }, [currentLevel, restrictedCountries])

  return (
    <>
      <div className={classes.KYCFormData__item}>
        <Typography
          fontWeight={uiTheme.typography.fontWeightBold}
          variant="body2"
          color={uiTheme.palette.common.white}
        >
          {currentStepStatusIndicator.title}
        </Typography>
        {textToRender}
      </div>
      {statusMessage && currentLevel !== 1 && (
        <div className={classes.KYCFormData__item}>
          <Typography
            fontWeight={uiTheme.typography.fontWeightBold}
            variant="body2"
            color={uiTheme.palette.common.white}
          >
            {translate('kycForm.currentStatus')}
          </Typography>
          <Alert severity={STATUS_TO_SEVERITY[status]}>{statusMessage}</Alert>
        </div>
      )}

      {/* <LevelStatus kyc={data} level={currentStepStatusIndicator.level} /> */}
      <currentStepStatusIndicator.Component proceed={proceed} kyc={kyc} />
    </>
  )
}
