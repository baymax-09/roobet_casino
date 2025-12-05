import React from 'react'
import clsx from 'clsx'
import anime from 'animejs'
import { Portal, Zoom, useMediaQuery } from '@mui/material'
import { FloatingIcon, theme as uiTheme, Typography } from '@project-atl/ui'
import { useSelector } from 'react-redux'

import {
  useAppUpdate,
  useTranslate,
  useDialogsOpener,
  useIsLoggedIn,
} from 'app/hooks'
import { setStorageItem } from 'app/util'
import { api } from 'common/util'
import ArrowDownIcon from 'assets/images/newDesignIcons/ArrowDown.svg'
import ChatIcon from 'assets/images/newDesignIcons/Chat.svg'

import { ChatMessage, ChatMessageLoader, ChatFooter, ChatRain } from './'
import { useChatMessages } from './useChatMessages'
import { ChatTopBar } from './ChatTopBar'

import { useChatStyles } from './Chat.styles'

interface ChatProps {
  container: React.MutableRefObject<HTMLDivElement | null>
  searchOpened: boolean
  hidden: boolean
  toggleHidden: (nextValue?: any) => void
}

interface ChatButtonProps {
  upSmall: boolean
  hidden: boolean
  toggleHidden: (nextValue?: any) => void
}

const supportsTouch =
  'ontouchmove' in window ||
  // @ts-expect-error figure out what this is doing and what it should be
  (window.DocumentTouch && document instanceof window.DocumentTouch)
const _scrollEventName = /Firefox/i.test(navigator.userAgent)
  ? 'DOMMouseScroll'
  : 'mousewheel'

const ChatButton: React.FC<ChatButtonProps> = ({
  toggleHidden,
  upSmall,
  hidden,
}) => {
  if (!upSmall) {
    return null
  }
  return (
    <FloatingIcon
      onClick={toggleHidden}
      size="small"
      // @ts-expect-error TODO AFTER MUI5-UPGRADE merge theme.
      color={!upSmall && !hidden ? 'tertiary' : 'primary'}
      {...((upSmall || hidden) && { fixed: 'right' })}
    >
      <img src={ChatIcon} alt="Open Chat" />
    </FloatingIcon>
  )
}

const Chat: React.FC<ChatProps> = ({
  container,
  searchOpened,
  hidden,
  toggleHidden,
}) => {
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const updateApp = useAppUpdate()

  const upSmall = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const hideControls = !upSmall && hidden

  const messagesRef = React.useRef<HTMLDivElement | null>(null)
  const timelineRef = React.useRef<ReturnType<typeof anime> | null>(null)
  const chatRef = React.useRef<HTMLDivElement>(null)
  const chatScrollingRef = React.useRef(false)

  const isLoggedIn = useIsLoggedIn()
  const isChatMod = useSelector(({ user }) => user?.isChatMod ?? false)

  const [loading, messages, users] = useChatMessages(hidden)
  const [autoScroll, setAutoScroll] = React.useState(true)

  const [errorMessage, setErrorMessage] = React.useState<string>('')

  const classes = useChatStyles()

  const scrollDown = React.useCallback(() => {
    if (hidden) {
      return
    }

    if (timelineRef.current) {
      timelineRef.current.pause()
      timelineRef.current = null
    }

    const { current } = messagesRef

    if (!current) {
      return
    }

    const diff = current.scrollHeight - current.scrollTop - current.clientHeight

    if (diff <= 0) {
      chatScrollingRef.current = false
      return
    }

    chatScrollingRef.current = true

    timelineRef.current = anime({
      targets: current,
      duration: 700,
      easing: 'cubicBezier(.5, .05, .1, .3)',
      scrollTop: current.scrollHeight,

      begin() {
        // intentionally left empty, but unsure why
      },

      complete() {
        chatScrollingRef.current = false
      },
    })
  }, [hidden, messagesRef])

  React.useEffect(() => {
    updateApp(app => {
      app.chatHidden = hidden
      // For medium viewport devices, close the side navigation when chat is open.
      if (upSmall && !isDesktop && !hidden && app.sideNavigationOpen) {
        app.sideNavigationOpen = false
      }
    })
  }, [hidden, updateApp, upSmall, isDesktop])

  React.useEffect(() => {
    if (loading || !autoScroll) {
      return
    }

    scrollDown()

    window.addEventListener('visibilitychange', scrollDown)
    window.addEventListener('resize', scrollDown)

    return () => {
      window.removeEventListener('visibilitychange', scrollDown)
      window.removeEventListener('resize', scrollDown)
    }
  }, [loading, messages, scrollDown, autoScroll])

  React.useEffect(() => {
    if (hidden) {
      return
    }

    const { current } = messagesRef

    if (!current) {
      return
    }

    const onScroll = event => {
      if (chatScrollingRef.current) {
        return
      }

      event.stopPropagation()

      const diff =
        current.scrollHeight - current.scrollTop - current.clientHeight

      if (autoScroll && diff > 10) {
        setAutoScroll(false)
      } else if (!autoScroll && diff <= 5) {
        setAutoScroll(true)
      }
    }

    if (supportsTouch) {
      current.addEventListener('touchmove', onScroll, { passive: true })
      current.addEventListener('scroll', onScroll, { passive: true })
    }

    current.addEventListener(_scrollEventName, onScroll, { passive: true })

    return () => {
      if (supportsTouch) {
        current.removeEventListener('touchmove', onScroll)
        current.removeEventListener('scroll', onScroll)
      }

      current.removeEventListener(_scrollEventName, onScroll)
    }
  }, [autoScroll, setAutoScroll, hidden])

  React.useEffect(() => {
    if (hidden) {
      return
    }

    const onClick = event => {
      const { target } = event

      if (!!target && target.classList.contains('mention')) {
        event.preventDefault()

        openDialog('profile', {
          params: {
            user: target.getAttribute('data-user'),
          },
        })
      }
    }

    const currentMsgsRef = messagesRef.current

    if (currentMsgsRef) {
      currentMsgsRef.addEventListener('click', onClick, false)
    }

    return () => {
      if (currentMsgsRef) {
        currentMsgsRef.removeEventListener('click', onClick)
      }
    }
  }, [hidden, openDialog])

  React.useEffect(() => {
    setStorageItem('chatHidden', hidden.toString())
  }, [hidden])

  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.ontransitionend = () => {
        window.dispatchEvent(new CustomEvent('resize'))
      }
    }
  }, [])

  const onDeleteMessage = React.useCallback(id => {
    try {
      api.post('/chat/delete', { id })
    } catch (err) {}
  }, [])

  return (
    <div
      ref={chatRef}
      className={clsx(classes.Chat, {
        [classes.Chat_searchOpened]: searchOpened,
      })}
    >
      {!hidden && (
        <ChatTopBar isMobile={!upSmall} toggleHidden={toggleHidden} />
      )}
      {!hideControls && isLoggedIn && <ChatRain />}

      {!hideControls ? (
        <div className={classes.Chat__wrapper}>
          {(upSmall || hidden) && (
            <Portal container={container.current}>
              <ChatButton
                hidden={hidden}
                upSmall={upSmall}
                toggleHidden={toggleHidden}
              />
            </Portal>
          )}

          <div ref={messagesRef} className={classes.Chat__messages}>
            {!loading &&
              messages.map(message => (
                <ChatMessage
                  canDeleteMessages={isChatMod}
                  onDelete={onDeleteMessage}
                  key={message.id}
                  message={message}
                />
              ))}

            {loading &&
              Array.from(
                {
                  length: 25,
                },
                (_, i) => <ChatMessageLoader key={i} />,
              )}
          </div>

          {(!autoScroll || errorMessage) && (
            // @ts-expect-error TODO fix me
            <Zoom direction="up" in mountOnEnter unmountOnExit>
              <div
                className={clsx(classes.ChatBanner__scrollBottom, {
                  [classes.ChatBanner__scrollBottom_error]: !!errorMessage,
                })}
                onClick={() => setAutoScroll(true)}
              >
                {!errorMessage && (
                  <img src={ArrowDownIcon} alt="Scroll to bottom" />
                )}
                <Typography
                  variant="body2"
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {!errorMessage
                    ? translate('chat.scrollToBottom')
                    : errorMessage}
                </Typography>
              </div>
            </Zoom>
          )}

          <ChatFooter
            users={users}
            chatContainer={chatRef}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </div>
      ) : (
        <Portal container={container.current}>
          <ChatButton
            hidden={hidden}
            upSmall={upSmall}
            toggleHidden={toggleHidden}
          />
        </Portal>
      )}
    </div>
  )
}

export default React.memo(Chat)
