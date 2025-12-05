import React from 'react'
import { type CountdownTimeDeltaFormatted } from 'react-countdown'
import { Typography, Explainer, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

import { useCountdownRendererStyles } from './CountdownRenderer.styles'

export interface CountdownDigitProps {
  unit: string
  text: string
  textShadowColor: CountdownRendererProps['textShadowColor']
}

export interface CountdownRendererProps {
  formatted: CountdownTimeDeltaFormatted
  countdownText?: string
  backgroundColor: string
  textShadowColor: string
}

const CountdownDigit: React.FC<CountdownDigitProps> = ({
  unit,
  text,
  textShadowColor,
}) => {
  const classes = useCountdownRendererStyles({
    textShadowColor,
  })

  return (
    <div className={classes.CountdownContainer}>
      <div className={classes.CountdownDigit}>
        <Typography
          textAlign="center"
          width={36}
          fontWeight={uiTheme.typography.fontWeightBlack}
          // Don't have a variant for this size :/
          fontSize="1.5rem"
          lineHeight="2.25rem"
        >
          {unit}
        </Typography>
      </div>
      <Typography
        className={classes.Countdown__textShadow}
        variant="body5"
        textAlign="center"
        fontWeight={uiTheme.typography.fontWeightBlack}
      >
        {text}
      </Typography>
    </div>
  )
}

export const CountdownRenderer: React.FC<CountdownRendererProps> = ({
  formatted,
  countdownText,
  backgroundColor,
  textShadowColor,
}) => {
  const { days, minutes, seconds } = formatted
  let hours = formatted.hours

  const classes = useCountdownRendererStyles({
    textShadowColor,
  })
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  if (days !== '00') {
    hours = String(Number(hours) * Number(days))
  }

  return (
    <>
      {!isTabletOrDesktop ? (
        <Explainer
          className={classes.Explainer}
          message={`${
            countdownText ?? translate('slotPotato.startsIn')
          } ${translate('slotPotato.times', {
            hours,
            minutes,
            seconds,
          })}`}
          backgroundColor={backgroundColor}
          typographyProps={{
            sx: { textShadow: `0px 1px 0px ${textShadowColor}` },
          }}
        />
      ) : (
        <div className={classes.CountdownContainer}>
          <Typography
            className={classes.Countdown__textShadow}
            variant="body2"
            textAlign="center"
            lineHeight="1.25rem"
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {countdownText ?? translate('slotPotato.startsIn')}
          </Typography>
          <div className={classes.CountdownDigitsContainer}>
            <CountdownDigit
              unit={hours}
              text={translate('slotPotato.hours')}
              textShadowColor={textShadowColor}
            />
            <CountdownDigit
              unit={minutes}
              text={translate('slotPotato.minutes')}
              textShadowColor={textShadowColor}
            />
            <CountdownDigit
              unit={seconds}
              text={translate('slotPotato.seconds')}
              textShadowColor={textShadowColor}
            />
          </div>
        </div>
      )}
    </>
  )
}
