import React from 'react'
import { useSelector } from 'react-redux'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import {
  InputField,
  Button,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'
import desktopBackground from 'assets/images/referral/desktopBackground.png'
import mobileBackground from 'assets/images/referral/mobileBackground.png'
import pokerChips from 'assets/images/referral/pokerChips.png'

import { DialogCoverWithImage } from '../DialogCoverWithImage'

import { useAffiliateLinkStyles } from './AffiliateLink.styles'

const AffiliateLink = () => {
  const classes = useAffiliateLinkStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const code = useSelector(({ user }) => (user ? user.nameLowercase : null))

  const affiliateLink = `https://roobet.com/?ref=${code}`

  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = setTimeout(() => setCopied(false), 3000)
    return () => clearTimeout(timeout)
  }, [copied, setCopied])

  return (
    <div className={classes.AffiliateLink}>
      <div className={classes.DialogCoverWithImageContainer}>
        <DialogCoverWithImage
          mobileBackground={mobileBackground}
          desktopBackground={desktopBackground}
          rightImage={pokerChips}
          rightImageAlt="Poker Chips"
          writtenContent={
            <div className={classes.DialogCoverWithImageContent}>
              <Typography
                className={classes.DialogCoverWithImageContent__heading}
                variant="h5"
              >
                {translate('affiliateLink.referYourFriends')}
              </Typography>
              <div className={classes.DialogCoverWithImageContentBody}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'fontWeightMedium',
                  }}
                >
                  {translate('affiliateLink.sharePromo', { code })}
                </Typography>
                <a
                  className={
                    classes.DialogCoverWithImageContentBody__body2__link
                  }
                  href="https://roobetaffiliates.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Typography
                    className={classes.DialogCoverWithImageContentBody__body2}
                    variant="body2"
                  >
                    {translate('affiliateLink.joinRoobetAffiliates')}
                  </Typography>
                </a>
              </div>
            </div>
          }
        />
      </div>
      <div className={classes.AffiliateLinkFields}>
        <InputField
          disabled={true}
          size="medium"
          autoFocus={isTabletOrDesktop}
          required
          fullWidth
          label={translate('affiliateLink.shareLink')}
          value={affiliateLink}
          className={classes.AffiliateLinkFields__input}
        />
        <CopyToClipboard text={affiliateLink}>
          <Button
            className={classes.CopyButton}
            label={
              !copied
                ? translate('affiliateLink.copyUrl')
                : translate('affiliateLink.copied!')
            }
            variant="contained"
            size="medium"
            onClick={() => setCopied(true)}
            color="primary"
            fullWidth={!isTabletOrDesktop}
          />
        </CopyToClipboard>
      </div>
    </div>
  )
}

export default React.memo(AffiliateLink)
