import React from 'react'
import { useMediaQuery } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Dropdown, Typography, theme as uiTheme } from '@project-atl/ui'
import { Globe } from '@project-atl/ui/assets'
import clsx from 'clsx'

import { useIsLoggedIn, useCashierOptions } from 'app/hooks'
import { setLocale } from 'app/lib/user'
import { localizations } from 'app/constants'
import RoobetLogo from 'assets/images/logo.svg'
import { getBalanceTypeIcon, getCachedSrc } from 'common/util'
import { AWARDS_CONFIGS, PARTNERS_CONFIGS } from 'app/constants/footer'

import { FooterItemWrapper } from './FooterItemWrapper'
import { FooterLinkCategories } from './FooterLinkCategories'

import { useFooterStyles } from './Footer.styles'

// https://github.com/lipis/flag-icons/tree/main/flags/4x3
const Footer: React.FC = () => {
  const classes = useFooterStyles()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isLoggedIn = useIsLoggedIn()
  const { t: translate, i18n } = useTranslation()

  const activeCode = i18n.language
  const onLanguageChange = async event => {
    const locale = event.target.value
    if (isLoggedIn) {
      await setLocale(locale)
    }
    i18n.changeLanguage(locale)
  }

  const { allCashierOptions } = useCashierOptions()

  React.useEffect(() => {
    if (window.apg_2b4a9aa5_31c9_4186_a6c3_0f53d37328dd) {
      window.apg_2b4a9aa5_31c9_4186_a6c3_0f53d37328dd.init()
    }
    if (window.xcm_b6fbd907_6224_495b_891d_cd23b3e29488) {
      window.xcm_b6fbd907_6224_495b_891d_cd23b3e29488.init()
    }
  }, [])

  return (
    <div className={classes.Footer}>
      <div className={classes.Footer__container}>
        <div>
          <hr className={classes.Divider} />
        </div>
        <div className={classes.FooterTopContainer}>
          <FooterLinkCategories />
        </div>
        <div className={classes.AcceptedCurrenciesAndLanguageContainer}>
          <div className={classes.LinkContainer__linkList}>
            <div className={classes.CategoryTitle}>
              <Typography
                variant="body2"
                color="white"
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                {translate('footer.acceptedCurrencies')}
              </Typography>
            </div>
            <div className={classes.AcceptedCurrencies}>
              {allCashierOptions.map(balance => {
                const { balanceType, walletName } = balance
                return (
                  <FooterItemWrapper key={balance.balanceType} padding={1.5}>
                    <img
                      className={classes.AcceptedCurrencies__icon}
                      alt={balanceType}
                      src={getBalanceTypeIcon(balanceType)}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={uiTheme.typography.fontWeightMedium}
                      color="white"
                    >
                      {walletName}
                    </Typography>
                  </FooterItemWrapper>
                )
              })}
            </div>
          </div>
          {activeCode !== null && (
            <div className={classes.LanguageSelectorContainer}>
              <div className={classes.CategoryTitle}>
                <Typography
                  variant="body2"
                  color="white"
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {translate('footer.language')}
                </Typography>
              </div>
              <Dropdown
                fullWidth
                onChange={onLanguageChange}
                value={activeCode}
                renderValue={value => {
                  if (typeof value !== 'string') {
                    return null
                  }

                  const lang = localizations.find(({ code }) => code === value)

                  return (
                    <div className={classes.LanguageSelector}>
                      <Globe
                        iconFill={uiTheme.palette.neutral[300]}
                        width={20}
                        height={20}
                      />
                      <Typography
                        className={classes.LanguageSelector__selectedLanguage}
                      >
                        {lang?.lang}
                      </Typography>
                    </div>
                  )
                }}
                menuOptions={localizations.map(locale => ({
                  name: locale.lang,
                  value: locale.code,
                }))}
              />
            </div>
          )}
        </div>
        <div>
          <hr className={classes.Divider} />
        </div>
        <div className={classes.AwardsAndLicensesContainer}>
          <div
            className={clsx(
              classes.LinkContainer__linkList,
              classes.LinkContainer__linkList_noFlexGrow,
            )}
          >
            <div className={classes.CategoryTitle}>
              <Typography
                variant="body2"
                color="white"
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                {translate('footer.awards')}
              </Typography>
            </div>
            <div className={classes.AwardContainer}>
              {AWARDS_CONFIGS.map(award => {
                const { alt, Icon } = award
                return (
                  <FooterItemWrapper key={alt} padding={2}>
                    <img
                      className={classes.AwardContainer__awardIcon}
                      alt={alt}
                      src={Icon}
                    />
                  </FooterItemWrapper>
                )
              })}
            </div>
          </div>
          <div className={classes.LinkContainer__linkList}>
            <div className={classes.CategoryTitle}>
              <Typography
                variant="body2"
                color="white"
                fontWeight={uiTheme.typography.fontWeightBold}
              >
                {translate('footer.licenses')}
              </Typography>
            </div>
            <div className={classes.AwardContainer}>
              <FooterItemWrapper padding={2} hoverState={true}>
                <div
                  className={classes.LicenseIcon}
                  id="xcm-b6fbd907-6224-495b-891d-cd23b3e29488"
                  data-xcm-seal-id="b6fbd907-6224-495b-891d-cd23b3e29488"
                  data-xcm-image-size={isTabletOrDesktop ? 73 : 57}
                  data-xcm-image-type="basic-small"
                ></div>
              </FooterItemWrapper>
              <FooterItemWrapper padding={2} hoverState={true}>
                <div
                  className={classes.LicenseIcon}
                  id="apg-2b4a9aa5-31c9-4186-a6c3-0f53d37328dd"
                  data-apg-seal-id="2b4a9aa5-31c9-4186-a6c3-0f53d37328dd"
                  data-apg-image-size={isTabletOrDesktop ? 73 : 57}
                  data-apg-image-type="basic-small"
                ></div>
              </FooterItemWrapper>
            </div>
          </div>
        </div>
        {!isTabletOrDesktop && (
          <div>
            <hr className={classes.Divider} />
          </div>
        )}
        <div className={classes.LinkContainer__linkList}>
          <div className={classes.CategoryTitle}>
            <Typography
              variant="body2"
              color="white"
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {translate('footer.partners')}
            </Typography>
          </div>
          <div className={classes.PartnerContainer}>
            {PARTNERS_CONFIGS.map(partner => {
              const { alt, Icon, height } = partner
              return (
                <FooterItemWrapper key={alt} padding={3}>
                  <img alt={alt} src={Icon} height={height} />
                </FooterItemWrapper>
              )
            })}
          </div>
        </div>
        <div>
          <hr className={classes.Divider} />
        </div>
        <div className={classes.LegalContainer}>
          <div className={classes.LegalContainer__rightContent}>
            <img
              className={classes.LegalContainer__roobetLogo}
              alt="Roobet Logo"
              src={getCachedSrc({ src: RoobetLogo, quality: 85 })}
            />
            <Typography
              variant="caption"
              classes={{ caption: classes.LegalContainer__legalText }}
            >
              {translate('footer.brandInformation')}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Footer)
