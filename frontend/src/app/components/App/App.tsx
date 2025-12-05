import React from 'react'
import clsx from 'clsx'
import ReactTooltip from 'react-tooltip'
import { Portal, useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'
import { SideNavigation, theme as uiTheme } from '@project-atl/ui'
import { type WritableDraft } from 'immer/dist/internal'

import { hasStorageItem, getStorageItem, getUrlParameter } from 'app/util'
import {
  Chat,
  GameFeed,
  GlobalBanner,
  GlobalSearch,
  LoadingOverlay,
} from 'app/components'
import { events } from 'app/core'
import { useAppUpdate, useDialogsOpener } from 'app/hooks'
import { useApp } from 'app/context'
import { useToasts } from 'common/hooks'
import { LoadingContextProvider } from 'app/context/loading.context'

import DisabledOverlay from './DisabledOverlay'
import { NavBar, BottomNavBar } from './Nav'
import Footer from './Footer'
import { MatchPromo } from '../MatchPromo'
import { MainMenuContainer } from './Nav/MainMenuContainer'
import { MainMenu } from './Nav/MainMenu'

import { useAppStyles } from './App.styles'

type AppProps = React.PropsWithChildren<Record<never, never>>

const App: React.FC<AppProps> = props => {
  const appState = useApp()
  const openDialog = useDialogsOpener()
  const { toast } = useToasts()
  const updateApp = useAppUpdate()
  const { sideNavigationOpen } = useApp()
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const fabsRef = React.useRef<HTMLDivElement | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const appContainerRef = React.useRef<HTMLDivElement | null>(null)
  const scrollRef = React.useRef<number | null>(null)
  const previousQueryStringRef = React.useRef('')

  const [searchOpened, toggleSearchOpened] = useToggle(false)

  const settingsLoaded = useSelector(({ settings }) => settings.loadedUser)
  const matchPromo = useSelector(({ user }) => !!user && user.matchPromo)

  React.useEffect(() => {
    updateApp(app => {
      app.appContainer = appContainerRef.current as WritableDraft<
        typeof appContainerRef.current
      >
    })
  }, [appContainerRef.current])

  React.useEffect(() => {
    let regionRestrictionTimer
    const onError = err => {
      if (err.code === 1002) {
        regionRestrictionTimer = setTimeout(() => {
          openDialog('regionRestricted')
        }, 1000)
      }
    }

    events.on('api:error', onError)

    // TODO: where should this belong?
    if (getUrlParameter('emailVerified') === 'true') {
      toast.success('Email verified.')
    }

    return () => {
      if (regionRestrictionTimer) {
        clearTimeout(regionRestrictionTimer)
      }
      events.off('api:error', onError)
    }
  }, [openDialog, toast])

  const [chatHidden, toggleChatHidden] = useToggle(
    (() => {
      if (!isTabletOrDesktop) {
        return true
      }

      try {
        if (hasStorageItem('chatHidden')) {
          return getStorageItem('chatHidden') === 'true'
        }
      } catch (err) {}

      return true
    })(),
  )

  React.useEffect(() => {
    if (searchOpened || (!chatHidden && !isTabletOrDesktop)) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [searchOpened, chatHidden, isDesktop])

  const determineContainerPosition = React.useMemo(() => {
    if (window.navigator.userAgent.match(/(iPhone)/i) && !chatHidden) {
      if (window.scrollY !== 0) {
        scrollRef.current = window.scrollY
      }
      return true
    }
    return false
  }, [chatHidden])

  const classes = useAppStyles({ fixPosition: determineContainerPosition })

  React.useEffect(() => {
    if (scrollRef.current && scrollRef.current !== 0 && chatHidden) {
      if (window.scrollY !== scrollRef.current) {
        window.scrollTo(0, scrollRef.current)
      }
      scrollRef.current = null
    }
  }, [chatHidden])

  React.useEffect(() => {
    if (isTabletOrDesktop) {
      updateApp(app => {
        app.sideNavigationOpen = false
      })
    }
  }, [isTabletOrDesktop])

  const handleSideNavigationToggle = React.useCallback(() => {
    updateApp(app => {
      app.sideNavigationOpen = !app.sideNavigationOpen
      // For medium viewport devices, close the chat when side navigation is open.
      if (
        isTabletOrDesktop &&
        !isDesktop &&
        app.sideNavigationOpen &&
        !chatHidden
      ) {
        toggleChatHidden(true)
      }
    })
  }, [updateApp, isTabletOrDesktop, isDesktop, toggleChatHidden, chatHidden])

  return (
    <LoadingContextProvider>
      <div id="app">
        <ReactTooltip effect="solid" type="light" id="global" />
        <DisabledOverlay />
        <LoadingOverlay />
        <div
          ref={wrapperRef}
          className={clsx(classes.App, {
            [classes.App_chatHidden]: chatHidden,
          })}
        >
          {isTabletOrDesktop && (
            <SideNavigation
              open={sideNavigationOpen}
              setOpen={handleSideNavigationToggle}
              content={<MainMenu />}
            />
          )}
          <div className={classes.App__contentContainer}>
            <NavBar
              toggleSearchOpened={toggleSearchOpened}
              chatHidden={chatHidden}
            />
            {sideNavigationOpen && !isTabletOrDesktop && <MainMenuContainer />}
            <div ref={appContainerRef} className={classes.App__pageContainer}>
              <GlobalBanner />
              {/* The rest of the application */}
              {props.children}
              <GameFeed />
              <Footer />
              <Portal container={wrapperRef.current}>
                <div
                  className={clsx(classes.App__openChat, {
                    [classes.App_chatHidden]: chatHidden,
                  })}
                >
                  {!appState.fabHidden && matchPromo ? (
                    <React.Suspense fallback={<></>}>
                      <MatchPromo {...matchPromo} />
                    </React.Suspense>
                  ) : (
                    <></>
                  )}
                  <div ref={fabsRef} />
                </div>
              </Portal>
            </div>
          </div>
          {settingsLoaded && (
            <div className={classes.App__chatWrapper}>
              <Chat
                container={fabsRef}
                hidden={chatHidden}
                toggleHidden={toggleChatHidden}
                searchOpened={searchOpened}
              />
            </div>
          )}
        </div>
        <BottomNavBar
          chatHidden={chatHidden}
          searchOpened={searchOpened}
          toggleChatHidden={toggleChatHidden}
          toggleSearchOpened={toggleSearchOpened}
        />
        {searchOpened && <GlobalSearch toggleOpen={toggleSearchOpened} />}
      </div>
    </LoadingContextProvider>
  )
}

export default React.memo(App)
