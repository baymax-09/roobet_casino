import React, { type PropsWithChildren } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import {
  List,
  ListItem,
  NavAccordion,
  Typography,
  theme as uiTheme,
  IconCategoryItem,
  Tooltip,
  type TooltipProps,
} from '@project-atl/ui'
import { Casino, VIP, Support, Globe, Trophy } from '@project-atl/ui/assets'
import numeral from 'numeral'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '@mui/material'
import { useHistory } from 'react-router'

import { setLocale } from 'app/lib/user'
import { getStorageItem, setStorageItem } from 'app/util'
import { useAppUpdate, useIsLoggedIn } from 'app/hooks'
import { localizations } from 'app/constants'
import { GeneralLoadingContext, useApp } from 'app/context'
import { CASINO_LOBBY_LINK } from 'app/routes/CasinoPageRoute'

import { OtherPagesOfferBlock } from './OtherPagesOfferBlock'
import { HoverIconButton } from './HoverIconButton'
import {
  getCasinoItems,
  getLocalizationItems,
  getSportsbookItems,
  tooltipMessage,
} from './utils'

import { useMainMenuStyles } from './MainMenu.styles'

// Persist which accordion is open through localStorage
const LOCAL_STORAGE_NAV_ACCORDION_STATE = 'navigationAccordionState'

interface ConditionalTooltipProps extends TooltipProps {
  open: boolean
}

const ConditionalTooltip: React.FC<
  PropsWithChildren<ConditionalTooltipProps>
> = ({ children, open, ...tooltipProps }) => {
  return !open ? (
    <Tooltip {...tooltipProps}>
      <div>{children}</div>
    </Tooltip>
  ) : (
    children
  )
}

export const MainMenu: React.FC = () => {
  const classes = useMainMenuStyles()
  const location = useLocation()
  const isLoggedIn = useIsLoggedIn()
  const { t: translate, i18n } = useTranslation()
  const { start, done } = React.useContext(GeneralLoadingContext)
  const { sideNavigationOpen } = useApp()
  const [expanded, setExpanded] = React.useState<string | boolean>(
    getStorageItem(LOCAL_STORAGE_NAV_ACCORDION_STATE) ?? 'casino',
  )
  const updateApp = useAppUpdate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const history = useHistory()

  const activeCode = i18n.language

  const globalStats = useSelector(
    ({ settings }) => settings.globalStats,
    shallowEqual,
  )

  const sportsbookActive =
    location.pathname === '/sports' &&
    (!location.search || location.search === '/')
  const casinoActive =
    location.pathname === CASINO_LOBBY_LINK &&
    (!location.search || location.search === '/')

  const onExpandIconClick = (incomingExpanded: string | boolean) => {
    setExpanded(prevExpanded =>
      incomingExpanded === prevExpanded ? false : incomingExpanded,
    )
  }

  const onItemClick = () => {
    if (!isTabletOrDesktop) {
      updateApp(app => {
        app.sideNavigationOpen = !app.sideNavigationOpen
      })
    }
  }

  React.useEffect(() => {
    if (expanded !== 'language') {
      setStorageItem(LOCAL_STORAGE_NAV_ACCORDION_STATE, expanded || 'casino')
    }
  }, [expanded])

  const onLanguageChange = async locale => {
    // Expand casino right away once they select a language
    setExpanded('casino')
    start('translations')
    if (isLoggedIn) {
      await setLocale(locale)
    }
    await i18n.changeLanguage(locale)
    done('translations')
    if (onItemClick) {
      onItemClick()
    }
  }

  React.useEffect(() => {
    if (location.pathname === '/sports' && expanded !== 'sportsbook') {
      setExpanded('sportsbook')
      return
    }
    if (location.pathname === '/casino' && expanded !== 'casino') {
      setExpanded('casino')
    }
  }, [location.pathname])

  const casinoItems = React.useMemo(
    () =>
      getCasinoItems(translate, location, isLoggedIn).map(casinoItem => ({
        ...casinoItem,
        buttonProps: {
          onClick: () => {
            history.push(casinoItem.buttonProps.path)
            onItemClick()
          },
        },
      })),
    [location.pathname, location.search, isLoggedIn],
  )
  const sportsbookItems = React.useMemo(
    () =>
      getSportsbookItems(translate, location).map(sportsbookItem => ({
        ...sportsbookItem,
        buttonProps: {
          onClick: () => {
            history.push(sportsbookItem.buttonProps.path)
            onItemClick()
          },
        },
      })),
    [location.pathname, location.search],
  )

  return (
    <List className={classes.MainMenu}>
      <ListItem
        key="casino"
        disableGutters
        disablePadding
        sx={{ display: 'block' }}
      >
        {sideNavigationOpen ? (
          <NavAccordion
            title={{
              text: translate('navbar.casino'),
              icon: Casino,
              active: casinoActive,
            }}
            color="primary"
            accordionSummaryProps={{
              onClick: () => {
                history.push(CASINO_LOBBY_LINK)
                if (onItemClick) {
                  onItemClick()
                }
              },
            }}
            items={casinoItems}
            expanded={expanded}
            onExpandIconClick={onExpandIconClick}
            expandedKey="casino"
          />
        ) : (
          <HoverIconButton
            popupId="casinoPopover"
            color="tertiary"
            size="medium"
            onClick={() => history.push(CASINO_LOBBY_LINK)}
            items={casinoItems}
            active={casinoActive}
          >
            <Casino active={casinoActive} />
          </HoverIconButton>
        )}
      </ListItem>
      <ListItem
        key="sportsbook"
        disableGutters
        disablePadding
        sx={{ display: 'block' }}
      >
        {sideNavigationOpen ? (
          <NavAccordion
            title={{
              text: translate('navbar.sportsbook'),
              icon: Trophy,
              active: sportsbookActive,
            }}
            color="primary"
            accordionSummaryProps={{
              onClick: () => {
                history.push('/sports')
                if (onItemClick) {
                  onItemClick()
                }
              },
            }}
            items={sportsbookItems}
            expanded={expanded}
            onExpandIconClick={onExpandIconClick}
            expandedKey="sportsbook"
          />
        ) : (
          <HoverIconButton
            popupId="sportsbookPopup"
            color="tertiary"
            size="medium"
            onClick={() => history.push('/sports')}
            items={sportsbookItems}
            active={sportsbookActive}
          >
            <Trophy active={sportsbookActive} />
          </HoverIconButton>
        )}
      </ListItem>
      <ListItem key="otherPagesOfferBlock" disableGutters disablePadding>
        <OtherPagesOfferBlock showOnlyIcons={!sideNavigationOpen} />
      </ListItem>
      <ConditionalTooltip
        title={tooltipMessage(translate('navbar.vipClub'))}
        placement="right"
        customBackgroundColor={uiTheme.palette.neutral[700]}
        open={sideNavigationOpen}
      >
        <IconCategoryItem
          fullWidth
          icon={VIP}
          onClick={() => {
            history.push('/vip')
            if (onItemClick) {
              onItemClick()
            }
          }}
          active={location.pathname === '/vip'}
          {...(sideNavigationOpen && { text: translate('navbar.vipClub') })}
        />
      </ConditionalTooltip>
      <ConditionalTooltip
        title={tooltipMessage(translate('navbar.liveSupport'))}
        placement="right"
        customBackgroundColor={uiTheme.palette.neutral[700]}
        open={sideNavigationOpen}
      >
        <IconCategoryItem
          fullWidth
          icon={Support}
          onClick={() => {
            if (onItemClick) {
              onItemClick()
            }
            window.Intercom('show')
          }}
          {...(sideNavigationOpen && { text: translate('navbar.liveSupport') })}
        />
      </ConditionalTooltip>
      <ListItem
        key="language"
        disableGutters
        disablePadding
        sx={{ display: 'block' }}
      >
        {sideNavigationOpen ? (
          <NavAccordion
            title={{
              text:
                localizations.find(({ code }) => code === activeCode)?.lang ??
                'English',
              icon: Globe,
              closeable: true,
            }}
            items={getLocalizationItems(
              onLanguageChange,
              activeCode,
              onItemClick,
            )}
            expanded={expanded}
            onExpandIconClick={onExpandIconClick}
            expandedKey="language"
          />
        ) : (
          <HoverIconButton
            popupId="localizationPopup"
            color="tertiary"
            size="medium"
            items={getLocalizationItems(
              onLanguageChange,
              activeCode,
              onItemClick,
            )}
          >
            <Globe />
          </HoverIconButton>
        )}
      </ListItem>
      {sideNavigationOpen && (
        <ListItem
          key="totalBetsWagered"
          className={classes.TotalBetsWagered}
          disableGutters
          disablePadding
          alignItems="flex-start"
        >
          <Typography
            variant="body4"
            color={uiTheme.palette.neutral[300]}
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {translate('navbar.totalBetsWagered')}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={uiTheme.typography.fontWeightMedium}
            color={uiTheme.palette.common.white}
          >
            {numeral(globalStats.allTimeNumBets).format('0,00')}
          </Typography>
        </ListItem>
      )}
    </List>
  )
}
