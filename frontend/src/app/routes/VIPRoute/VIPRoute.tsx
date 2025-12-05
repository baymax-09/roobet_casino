import React from 'react'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import {
  Champagne,
  Trophy2,
  Casino,
  HeadSupport,
  Coins,
  Power,
  Star,
  Activity,
  Variety,
} from '@project-atl/ui/assets'
import clsx from 'clsx'
import { useHistory } from 'react-router'

import crown from 'assets/images/vip/crown.png'
import leftChip from 'assets/images/vip/leftChip.png'
import rightChip from 'assets/images/vip/rightChip.png'
import bottomChip from 'assets/images/vip/bottomChip.png'
import topLeftCoin from 'assets/images/vip/topLeftCoin.png'
import middleLeftCoin from 'assets/images/vip/middleLeftCoin.png'
import bottomLeftCoin from 'assets/images/vip/bottomLeftCoin.png'
import topRightCoin from 'assets/images/vip/topRightCoin.png'
import bottomRightCoin from 'assets/images/vip/bottomRightCoin.png'
import { getCachedSrc } from 'common/util'
import { useIsLoggedIn, useTranslate } from 'app/hooks'
import { LoginButtonsContainer } from 'app/components/App/Nav'

import FAQs from './FAQs'
import { BlockContentWithHeader } from './BlockContentWithHeader'
import { CASINO_LOBBY_LINK } from '../CasinoPageRoute'

import { useVIPRouteStyles } from './VIPRoute.styles'

const VIPRoute: React.FC = () => {
  const classes = useVIPRouteStyles()
  const translate = useTranslate()
  const isLoggedIn = useIsLoggedIn()
  const isMediumDevice = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const history = useHistory()

  const benefits = React.useMemo(
    () => [
      {
        title: translate('vip.benefitTitle1'),
        description: translate('vip.benefitDescription1'),
        icon: Champagne,
      },
      {
        title: translate('vip.benefitTitle2'),
        description: translate('vip.benefitDescription2'),
        icon: Trophy2,
      },
      {
        title: translate('vip.benefitTitle3'),
        description: translate('vip.benefitDescription3'),
        icon: Casino,
      },
      {
        title: translate('vip.benefitTitle4'),
        description: translate('vip.benefitDescription4'),
        icon: HeadSupport,
      },
      {
        title: translate('vip.benefitTitle5'),
        description: translate('vip.benefitDescription5'),
        icon: Coins,
      },
      {
        title: translate('vip.benefitTitle6'),
        description: translate('vip.benefitDescription6'),
        icon: Power,
      },
    ],
    [],
  )

  const features = React.useMemo(
    () => [
      {
        title: translate('vip.featureTitle1'),
        description: translate('vip.featureDescription1'),
        icon: Star,
      },
      {
        title: translate('vip.featureTitle2'),
        description: translate('vip.featureDescription2'),
        icon: Activity,
      },
      {
        title: translate('vip.featureTitle3'),
        description: translate('vip.featureDescription3'),
        icon: Variety,
      },
    ],
    [],
  )

  return (
    <div className={classes.VIPRoute}>
      <div className={classes.VIPRouteContainer}>
        <div className={classes.VIPRouteMainContent}>
          <div className={classes.Section}>
            <img
              alt="VIP Rewards"
              className={classes.CrownImage}
              src={getCachedSrc({ src: crown })}
            />

            <BlockContentWithHeader
              descriptionTypographyProps={{
                className: classes.VIPClubMembership,
              }}
              title={translate('vip.vipClubMembershipTitle1')}
              goldColorTitle={translate('vip.vipClubMembershipTitle2')}
              description={translate('vip.vipClubMembershipDescription')}
              content={
                <div className={classes.ButtonContainer}>
                  {isLoggedIn ? (
                    <Button
                      className={classes.PlayNowButton}
                      variant="contained"
                      color="primary"
                      size="medium"
                      borderOutline={true}
                      onClick={() => history.push(CASINO_LOBBY_LINK)}
                      label={translate('vip.playNow')}
                    />
                  ) : (
                    <LoginButtonsContainer
                      buttonProps={{ fullWidth: true }}
                      buttonContainerClassName={classes.LoginButtonContainer}
                    />
                  )}
                </div>
              }
            />
            <img
              className={clsx(classes.Coin, classes.Coin__topLeft)}
              alt="Coin 1"
              style={{ position: 'absolute' }}
              src={getCachedSrc({ src: topLeftCoin })}
            />
            {isMediumDevice && (
              <>
                <img
                  className={clsx(classes.Coin, classes.Coin__middleLeft)}
                  alt="Coin 2"
                  style={{ position: 'absolute' }}
                  src={getCachedSrc({ src: middleLeftCoin })}
                />
                <img
                  className={clsx(classes.Coin, classes.Coin__bottomLeft)}
                  alt="Coin 3"
                  style={{ position: 'absolute' }}
                  src={getCachedSrc({ src: bottomLeftCoin })}
                />
                <img
                  className={clsx(classes.Coin, classes.Coin__topRight)}
                  alt="Coin 4"
                  style={{ position: 'absolute' }}
                  src={getCachedSrc({ src: topRightCoin })}
                />
              </>
            )}
            <img
              className={clsx(classes.Coin, classes.Coin__bottomRight)}
              alt="Coin 5"
              style={{ position: 'absolute' }}
              src={getCachedSrc({ src: bottomRightCoin })}
            />
          </div>

          <div className={classes.Section}>
            <BlockContentWithHeader
              title={translate('vip.vipBenefitTitle1')}
              goldColorTitle={translate('vip.vipBenefitTitle2')}
              description={translate('vip.vipBenefitDescription')}
              titleTypographyProps={{ component: 'span' }}
              content={
                <div className={classes.BenefitsContainer}>
                  {benefits.map(({ icon: Icon, title, description }) => (
                    <div className={classes.Benefit}>
                      <Icon
                        topHalfFill={uiTheme.palette.secondary.main}
                        bottomHalfFill={uiTheme.palette.secondary.main}
                        iconFill={uiTheme.palette.secondary.main}
                        width={isMediumDevice ? '3rem' : '2.25rem'}
                        height={isMediumDevice ? '3rem' : '2.25rem'}
                      />
                      <div className={classes.Benefit__textContainer}>
                        <Typography
                          textAlign="center"
                          color={uiTheme.palette.common.white}
                          fontWeight={uiTheme.typography.fontWeightBold}
                          {...(isMediumDevice
                            ? { variant: 'h5' }
                            : { fontSize: '1.5rem', lineHeight: '2rem' })}
                        >
                          {title}
                        </Typography>
                        <Typography
                          textAlign="center"
                          color={uiTheme.palette.neutral[200]}
                          fontWeight={uiTheme.typography.fontWeightMedium}
                          variant={isMediumDevice ? 'h6' : 'body1'}
                        >
                          {description}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
          </div>
          <div className={clsx(classes.SnoopContainer, classes.Section)}>
            <iframe
              className={classes.SnoopVideo}
              src="https://www.youtube.com/embed/rT3iS33jr78?si=WSLcRLJvZmlyUR3D"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
            <img
              className={clsx(classes.PokerChip, classes.PokerChip__right)}
              alt="Right Poker Chip"
              src={getCachedSrc({ src: rightChip })}
            />
            <img
              className={clsx(classes.PokerChip, classes.PokerChip__bottom)}
              alt="Bottom Poker Chip"
              src={getCachedSrc({ src: bottomChip })}
            />
            <img
              className={clsx(classes.PokerChip, classes.PokerChip__left)}
              alt="Left Poker Chip"
              src={getCachedSrc({ src: leftChip })}
            />
          </div>
          <div className={classes.Section}>
            <BlockContentWithHeader
              descriptionTypographyProps={{
                className: classes.VIPClubInvitation,
              }}
              title={translate('vip.vipClubInvitationTitle1')}
              goldColorTitle={translate('vip.vipClubInvitationTitle2')}
              description={translate('vip.vipClubInvitationDescription')}
              content={
                <div className={classes.FeaturesContainer}>
                  {features.map(({ icon: Icon, title, description }) => (
                    <div className={classes.Feature}>
                      <div className={classes.Feature__topContainer}>
                        <div>
                          <Icon
                            iconFill={uiTheme.palette.secondary.main}
                            width={isMediumDevice ? '48px' : '2.25rem'}
                            height={isMediumDevice ? '48px' : '2.25rem'}
                          />
                        </div>
                        <div className={classes.Feature__textContainer}>
                          <Typography
                            textAlign="start"
                            color={uiTheme.palette.common.white}
                            fontWeight={uiTheme.typography.fontWeightBlack}
                            {...(isMediumDevice
                              ? { variant: 'h5' }
                              : { fontSize: '1.5rem', lineHeight: '2rem' })}
                          >
                            {title}
                          </Typography>
                          <Typography
                            textAlign="start"
                            color={uiTheme.palette.neutral[200]}
                            fontWeight={uiTheme.typography.fontWeightRegular}
                            variant={isMediumDevice ? 'h6' : 'body1'}
                          >
                            {description}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        </div>
        <FAQs />
      </div>
    </div>
  )
}

export default React.memo(VIPRoute)
