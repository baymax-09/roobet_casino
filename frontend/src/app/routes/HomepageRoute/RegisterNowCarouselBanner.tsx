import React from 'react'
import { useMediaQuery } from '@mui/material'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import ReCaptcha from 'react-google-recaptcha'

import hero from 'assets/images/homepageCarousel/hero.jpg'
import { getCachedSrc } from 'common/util'
import { useDialogsOpener, useTranslate } from 'app/hooks'
import { Socials } from 'app/dialogs/AuthDialog/Socials'
import { useToasts } from 'common/hooks'

import { useRegisterNowCarouselBannerStyles } from './RegisterNowCarouselBanner.styles'

export const RegisterNowCarouselBanner: React.FC = () => {
  const classes = useRegisterNowCarouselBannerStyles({
    bgImage: getCachedSrc({ src: hero }),
  })

  const { toast } = useToasts()
  const translate = useTranslate()
  const openDialog = useDialogsOpener()

  const recaptchaRef = React.useRef<InstanceType<typeof ReCaptcha>>(null)

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const [oauthUri, setOauthUri] = React.useState<string | null>(null)

  const onRecaptchaChange = () => {
    if (!recaptchaRef.current) {
      return
    }

    recaptchaRef.current.reset()

    if (oauthUri && oauthUri.length) {
      window.location.href = oauthUri
    }
  }

  // Callback of sorts when oauth uri is set for captcha
  React.useEffect(() => {
    if (oauthUri && oauthUri.length && recaptchaRef.current) {
      recaptchaRef.current.execute()
    }
  }, [oauthUri])

  return (
    <div className={classes.RegisterNowCarouselBanner}>
      <div key="snoop" className={classes.RegisterNowCarousel} />
      <div className={classes.RegisterForm}>
        <div className={classes.RegisterForm__textContainer}>
          <Typography
            textAlign="center"
            color={uiTheme.palette.common.white}
            fontWeight={uiTheme.typography.fontWeightBlack}
            variant="h5"
          >
            {translate('homepage.welcomeToRoobet')}
          </Typography>
          <Typography
            textAlign="center"
            color={uiTheme.palette.neutral[300]}
            fontWeight={uiTheme.typography.fontWeightBold}
            variant="body1"
          >
            {translate('homepage.hopIn')}
          </Typography>
        </div>
        <Button
          onClick={() =>
            openDialog('auth', {
              params: {
                tab: 'register',
              },
            })
          }
          fullWidth
          variant="contained"
          color="primary"
          size="extraLarge"
          label={translate('homepage.registerNow')}
        />
        {isTabletOrDesktop && (
          <Socials
            mode="register"
            busy={false}
            recaptchaRef={recaptchaRef}
            onlyIcon={isTabletOrDesktop && !isDesktop}
            setOauthUri={setOauthUri}
          />
        )}
      </div>
      <ReCaptcha
        ref={recaptchaRef}
        size="invisible"
        sitekey="6LcyLZQUAAAAALOaIzlr4pTcnRRKEQn-d6sQIFUx"
        onErrored={() => {
          toast.error(translate('authDialog.recaptchaError'))
        }}
        onChange={onRecaptchaChange}
      />
    </div>
  )
}
