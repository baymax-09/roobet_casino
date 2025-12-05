import React, { type CSSProperties } from 'react'
import {
  type BaseSVGIconType,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'
import { Check, Clock2, Close2 } from '@project-atl/ui/assets'

import { store } from 'app/util'
import { useTranslate } from 'app/hooks'
import { useAxiosGet } from 'common/hooks'
import { setUser } from 'app/reducers/user'
import {
  KYCLevel1FormRedesign,
  KYCLevel2Form,
  KYCLevel3Form,
  KYCLevel4Form,
} from 'app/components'
import { MAX_KYC_LEVEL } from 'common/constants'
import { type KYCGet, type VerifiedKYCLevel } from 'common/types'
import { defaultSocket } from 'app/lib/sockets'
import { type KYCLevelStatus } from 'app/components/KycForms/types'
import { Skeleton, Slider } from 'mrooi'

import { KYCFormData } from './KYCFormData'

import { useVerificationTabStyles } from './VerificationTab.styles'

export interface StepStatusIndicator {
  key: string
  level: VerifiedKYCLevel
  title: string
  verificationLevelText: string
  Component: React.FC<any>
  sectionDescription?: React.ReactNode
}

interface VerificationTabProps {
  params?: {
    kycLevel?: number
  }
}

interface GetIconAndBackgroundColors {
  icon: React.FC<BaseSVGIconType>
  borderColor: CSSProperties['color']
  iconColor: CSSProperties['color']
  iconBackgroundColor: CSSProperties['backgroundColor']
  activeIconBackgroundColor?: CSSProperties['backgroundColor']
}

const getIconAndBackgroundColors: (
  status: KYCLevelStatus,
) => GetIconAndBackgroundColors = (status: KYCLevelStatus) => {
  if (status === 'rejected') {
    return {
      icon: Close2,
      borderColor: uiTheme.palette.error[500],
      iconColor: '#851C4C',
      iconBackgroundColor: uiTheme.palette.error[500],
    }
  }

  if (status === 'pending') {
    return {
      icon: Clock2,
      borderColor: uiTheme.palette.secondary[500],
      iconColor: '#8C741D',
      iconBackgroundColor: uiTheme.palette.secondary[500],
    }
  }

  if (status === 'complete') {
    return {
      icon: Check,
      borderColor: uiTheme.palette.success[500],
      iconColor: '#4E8731',
      iconBackgroundColor: uiTheme.palette.success[500],
    }
  }

  return {
    icon: Check,
    borderColor: uiTheme.palette.primary[400],
    iconColor: '#4F3796',
    iconBackgroundColor: uiTheme.palette.neutral[900],
    activeIconBackgroundColor: uiTheme.palette.primary[400],
  }
}

export const VerificationTab: React.FC<VerificationTabProps> = ({ params }) => {
  const translate = useTranslate()
  const classes = useVerificationTabStyles()

  const [selectedStatusIndicator, setSelectedStatusIndicator] = React.useState<
    number | undefined
  >(params?.kycLevel)

  const [{ data }, reloadKyc] = useAxiosGet<KYCGet>('/user/kyc/get', {
    onCompleted: data => {
      store.dispatch(setUser({ kycLevel: data.kycLevel }))
      const levels = data.levels ?? []

      const nextLevel = data.levels
        ? Object.keys(levels).find(
            key => levels[key].status === 'incomplete',
          ) ?? MAX_KYC_LEVEL
        : MAX_KYC_LEVEL

      setSelectedStatusIndicator(Number(nextLevel))
    },
  })

  // const proceed = () => {
  //   setSelectedStatusIndicator(prev => {
  //     return prev === MAX_KYC_LEVEL ? MAX_KYC_LEVEL : prev + 1
  //   })
  // }

  const stepStatusIndicators: StepStatusIndicator[] = React.useMemo(
    () => [
      {
        key: 'level1',
        level: 1,
        title: translate('kycForm.level1Title'),
        verificationLevelText: translate('kycForm.verificationLevel', {
          verificationLevel: 1,
        }),
        Component: KYCLevel1FormRedesign,
      },
      {
        key: 'level2',
        level: 2,
        title: translate('kycForm.level2Title'),
        verificationLevelText: translate('kycForm.verificationLevel', {
          verificationLevel: 2,
        }),
        Component: KYCLevel2Form,
        sectionDescription: (
          <Typography
            variant="body2"
            fontWeight={uiTheme.typography.fontWeightMedium}
            color={uiTheme.palette.neutral[400]}
          >
            {translate('kycForm.level2Description1')}
          </Typography>
        ),
      },
      {
        key: 'level3',
        level: 3,
        title: translate('kycForm.level3Title'),
        verificationLevelText: translate('kycForm.verificationLevel', {
          verificationLevel: 3,
        }),
        iconColor: 'transparent',
        idleIconBackgroundColor: uiTheme.palette.success[500],
        Component: KYCLevel3Form,
      },
      {
        key: 'level4',
        level: 4,
        title: translate('kycForm.level4Title'),
        verificationLevelText: translate('kycForm.verificationLevel', {
          verificationLevel: 4,
        }),
        Component: KYCLevel4Form,
      },
    ],
    [data],
  )

  // Listen for KYC updates.
  React.useEffect(() => {
    defaultSocket._socket.on('kycUpdated', reloadKyc)

    return () => {
      defaultSocket._socket.off('kycUpdated', reloadKyc)
    }
  }, [reloadKyc])

  const currentStepStatusIndicator = stepStatusIndicators.find(
    stepIndicator => stepIndicator.level === selectedStatusIndicator,
  )

  const levels = data?.kyc?.levels

  return (
    <div className={classes.VerificationTab}>
      <Slider
        slideClassName={classes.StatusIndicatorSlide}
        slides={
          levels
            ? stepStatusIndicators.map(
                ({ key, title, verificationLevelText, level }) => {
                  const active = selectedStatusIndicator === level
                  const levelStatus = levels[level].status
                  const {
                    icon: IconComponent,
                    borderColor,
                    iconColor,
                    iconBackgroundColor,
                    activeIconBackgroundColor,
                  } = getIconAndBackgroundColors(levelStatus)

                  return (
                    <div
                      role="button"
                      key={key}
                      className={classes.StatusIndicator}
                      onClick={() => setSelectedStatusIndicator(level)}
                      {...(selectedStatusIndicator === level && {
                        style: {
                          border: `2px solid ${borderColor}`,
                          backgroundColor: iconColor,
                        },
                      })}
                    >
                      <div
                        style={
                          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                          {
                            backgroundColor:
                              active && activeIconBackgroundColor
                                ? activeIconBackgroundColor
                                : iconBackgroundColor,
                            '--icon-fill-color': active ? iconColor : undefined,
                          } as React.CSSProperties
                        }
                        className={classes.StatusIndicator__iconContainer}
                      >
                        <IconComponent className={classes.Icon} />
                      </div>
                      <div>
                        <Typography
                          whiteSpace="nowrap"
                          variant="body2"
                          color={uiTheme.palette.common.white}
                          fontWeight={uiTheme.typography.fontWeightBold}
                        >
                          {title}
                        </Typography>
                        <Typography
                          variant="body4"
                          color={
                            active
                              ? uiTheme.palette.common.white
                              : 'var(--text-color)'
                          }
                          fontWeight={uiTheme.typography.fontWeightMedium}
                        >
                          {verificationLevelText}
                        </Typography>
                      </div>
                    </div>
                  )
                },
              )
            : new Array(4)
                .fill('')
                .map((_, index) => (
                  <Skeleton
                    key={index}
                    className={classes.Skeleton}
                    width="217px"
                    height="4rem"
                    animation="wave"
                    variant="rectangular"
                  />
                ))
        }
      />
      {data && currentStepStatusIndicator ? (
        <KYCFormData
          currentStepStatusIndicator={currentStepStatusIndicator}
          kyc={data}
          // TODO: Don't need anymore
          proceed={() => {}}
        />
      ) : (
        <Skeleton
          className={classes.Skeleton}
          width="100%"
          height="100%"
          animation="wave"
          variant="rectangular"
        />
      )}
    </div>
  )
}
