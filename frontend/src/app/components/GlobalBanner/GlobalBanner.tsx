import React, { useEffect } from 'react'
import { SnackbarContent, IconButton } from '@mui/material'
import { useSelector } from 'react-redux'
import CloseIcon from '@mui/icons-material/Close'

import { Link } from 'mrooi'
import { useAppUpdate, useTranslate } from 'app/hooks'
import {
  hashString,
  setStorageItem,
  hasStorageItem,
  getStorageItem,
} from 'app/util'

import { useGlobalBannerStyles } from './GlobalBanner.styles'

export const GlobalBanner = () => {
  const classes = useGlobalBannerStyles()
  const updateApp = useAppUpdate()
  const translate = useTranslate()
  // @ts-expect-error I don't think this exists
  const hasUpdate = useSelector(({ settings }) => settings?.update)
  const bannerMessage = useSelector(({ settings }) => settings?.banner)
  const bannerLink = useSelector(({ settings }) => settings?.bannerLink)
  const bannerLinkTitle = useSelector(
    ({ settings }) => settings?.bannerLinkTitle,
  )

  const [dismissed, setDismissed] = React.useState(false)

  const hidden = React.useMemo(() => {
    if (dismissed) {
      return true
    } else if (bannerMessage && hasStorageItem('dismissBanner')) {
      if (
        hashString(bannerMessage).toString() === getStorageItem('dismissBanner')
      ) {
        setDismissed(true)
        return true
      }
    }

    return false
  }, [dismissed, bannerMessage, setDismissed])

  const closeBanner = React.useCallback(() => {
    setStorageItem('dismissBanner', hashString(bannerMessage))
    setDismissed(true)
  }, [bannerMessage])

  const show = !hidden && (hasUpdate || bannerMessage)

  useEffect(() => {
    updateApp(state => {
      state.hasBanner = show
    })
  }, [show])

  if (!show) {
    return null
  }

  return (
    <SnackbarContent
      elevation={0}
      className={classes.GlobalBanner}
      classes={{ message: classes.GlobalBanner__message }}
      message={
        <>
          <span className={classes.Message__text}>
            {hasUpdate ? translate('globalBanner.refreshText') : bannerMessage}{' '}
            {bannerLink && bannerLinkTitle && !hasUpdate ? (
              <Link urlOrPath={bannerLink}>
                <span className={classes.GlobalBanner__titleLink}>
                  {bannerLinkTitle}
                </span>
              </Link>
            ) : null}
          </span>
          {!hasUpdate && (
            <IconButton
              size="small"
              onClick={closeBanner}
              className={classes.GlobalBanner__closeButton}
            >
              <CloseIcon />
            </IconButton>
          )}
        </>
      }
    />
  )
}

export default React.memo(GlobalBanner)
