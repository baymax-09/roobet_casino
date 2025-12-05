import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { useTranslation } from 'react-i18next'

import { setLocale } from 'app/lib/user'
import { useIsLoggedIn } from 'app/hooks'

export const useJapanRoutStyles = makeStyles(() =>
  createStyles({
    Content: {
      width: '100%',
    },
  }),
)

const JapanRoute = () => {
  const classes = useJapanRoutStyles()

  const isLoggedIn = useIsLoggedIn()
  const {
    i18n: { changeLanguage },
  } = useTranslation()

  React.useEffect(() => {
    const iframe = document.getElementById(
      'japan-homepage',
    ) as HTMLIFrameElement

    const resizeIframe = () => {
      iframe.width = String(iframe.contentWindow?.document.body.scrollWidth)
      iframe.height = String(iframe.contentWindow?.document.body.scrollHeight)
    }

    iframe.addEventListener('load', resizeIframe)
  }, [])

  React.useEffect(() => {
    changeLanguage('ja')

    // Save to user record if authenticated.
    if (isLoggedIn) {
      setLocale('ja')
    }
  }, [changeLanguage, isLoggedIn])

  return (
    <iframe
      title="Japan Homepage"
      id="japan-homepage"
      className={classes.Content}
      src="resources/jp/index.html"
    />
  )
}

export default React.memo(JapanRoute)
