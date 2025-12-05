import React, { useCallback } from 'react'
import clsx from 'clsx'
import { Portal } from '@mui/material'
import moment from 'moment'
import {
  Button,
  IconButton,
  InputField,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'

import SendIcon from 'assets/images/newDesignIcons/Send.svg'
import { Button as TempButton } from 'mrooi'
import { defaultSocket } from 'app/lib/sockets'
import {
  useAccessControl,
  useDialogsOpener,
  useIsLoggedIn,
  useTranslate,
} from 'app/hooks'
import { env } from 'common/constants'
import { isApiError } from 'common/util'

import { ChatPopup, type ChatPopupItems } from './ChatPopup'
import { RainDrawer, RulesDrawer } from './ChatDrawer'

import { useChatFooterStyles } from './ChatFooter.styles'

interface ChatFooterProps {
  users: Record<string, any>
  chatContainer: React.RefObject<HTMLDivElement>
  errorMessage: string
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
}

export interface ChatPopupState {
  items: ChatPopupItems[]
  focusedElementIndex: number | null
}

type StartingCommand = '@' | '/'

const USER_COMMAND_LIST = [
  { name: 'balance', active: 'Share your current balance' },
  { name: 'shake', active: "Party like it's 2013" },
]

const STAFF_COMMAND_LIST = [
  // { name: 'slowmode', active: 'Trigger slowmode' },
]

const ChatFooter: React.FC<ChatFooterProps> = ({
  users,
  chatContainer,
  errorMessage,
  setErrorMessage,
}) => {
  const classes = useChatFooterStyles()
  const translate = useTranslate()

  const openDialog = useDialogsOpener()
  const isLoggedIn = useIsLoggedIn()
  const { hasAccess: hasStaffCommands } = useAccessControl(['chat:update'])

  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [userStatus, setUserStatus] = React.useState('')
  const [startingCommand, setStartingCommand] =
    React.useState<StartingCommand | null>(null)
  const [item, setItem] = React.useState<string | null>(null)
  const posRef = React.useRef<{ start: number; end: number } | null>()
  const inputRef = React.useRef<HTMLInputElement>()
  const [rainOpen, setRainOpen] = React.useState<boolean>(false)
  const [rulesOpen, setRulesOpen] = React.useState<boolean>(false)
  const COMMANDS_LIST = hasStaffCommands
    ? USER_COMMAND_LIST.concat(STAFF_COMMAND_LIST)
    : USER_COMMAND_LIST
  const [chatPopupState, setChatPopupState] = React.useState<ChatPopupState>({
    items: [],
    focusedElementIndex: null,
  })

  const handleStatus = status => {
    setUserStatus(status)
  }

  React.useEffect(() => {
    handleStatus(userStatus)
  }, [userStatus])

  const performHarlemShake = useCallback(async () => {
    const harlemShake = await import('./harlem-shake')
    harlemShake.play()
  }, [])

  const popupItems = React.useMemo(() => {
    if (startingCommand === null || item === null) {
      return []
    }

    if (startingCommand === '@') {
      const recentUsers = Object.keys(users)

      return recentUsers
        .filter(name => name.toLowerCase().indexOf(item) === 0)
        .map(name => ({
          name,
          active: moment(users[name]).fromNow(),
        }))
    }

    if (startingCommand === '/') {
      return COMMANDS_LIST.map(command => ({
        name: command.name,
        active: command.active,
      })).filter(command => command.name.toLowerCase().indexOf(item) === 0)
    }

    return []
  }, [item, users, startingCommand])

  const sendMessage = async () => {
    if (busy) {
      return
    }

    if (!isLoggedIn) {
      openDialog('auth')
      return
    }

    if (message.trim() === '/shake') {
      await performHarlemShake()
    }

    setBusy(true)
    setItem(null)

    try {
      defaultSocket._socket.emit(
        'chat_send',
        {
          socketToken: defaultSocket.socketToken,
          message,
          userStatus,
        },
        err => {
          setErrorMessage(err)
        },
      )

      window.dataLayer.push({ event: 'chat_send' })

      setMessage('')
      setBusy(false)
    } catch (err) {
      if (isApiError(err)) {
        setErrorMessage(err.response ? err.response.data : err.message)
      }
      setBusy(false)
    }
  }

  const replaceItem = item => {
    const mentionPosition = posRef.current
    if (mentionPosition) {
      let newMessage = message.substring(0, mentionPosition.start).trim()

      newMessage += ` ${startingCommand}${item} ${message.substring(
        mentionPosition.end,
      )}`
      newMessage = newMessage.trim()

      // Trailing space to complete item name
      setMessage(`${newMessage} `)
      setItem(null)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = event => {
    const { key } = event
    const { focusedElementIndex, items } = chatPopupState

    //  --- For controlling the selected chat popup item ---
    if (key === 'ArrowUp') {
      event.preventDefault()
      if (items.length === 0 || focusedElementIndex === null) {
        return
      }
      if (focusedElementIndex === 0) {
        setChatPopupState(prev => ({
          ...prev,
          focusedElementIndex: prev.items.length - 1,
        }))
        return false
      }
      setChatPopupState(prev => ({
        ...prev,
        focusedElementIndex: prev.focusedElementIndex! - 1,
      }))
      return false
    }

    if (key === 'ArrowDown') {
      event.preventDefault()
      if (items.length === 0 || focusedElementIndex === null) {
        return
      }
      if (focusedElementIndex === items.length - 1) {
        setChatPopupState(prev => ({ ...prev, focusedElementIndex: 0 }))
        return false
      }
      setChatPopupState(prev => ({
        ...prev,
        focusedElementIndex: prev.focusedElementIndex! + 1,
      }))
      return false
    }
    //  ---

    if (key === 'Enter') {
      if (
        startingCommand !== null &&
        items.length > 0 &&
        popupItems[focusedElementIndex ?? 0]?.name
      ) {
        replaceItem(popupItems[focusedElementIndex ?? 0]?.name)
        setStartingCommand(null)
        setItem(null)
        return
      }

      sendMessage()
    }
  }

  const onKeyUp = event => {
    const position = event.target.selectionStart
    const value = event.target.value

    let foundItem = false

    for (let i = position - 1; i >= 0; i--) {
      if (value[i] === '@' || value[i] === '/') {
        let end = value.length

        for (let j = i + 1; j < value.length; j++) {
          if (!/^[a-z0-9]+$/i.test(value[j])) {
            end = j
            break
          }
        }

        if (value[i] === '@' || value[i] === '/') {
          foundItem = true
          posRef.current = {
            end,
            start: i,
          }
          setStartingCommand(value[i])

          setItem(value.substring(i + 1, end).toLowerCase())
          break
        }
      }

      if (!/^[a-z0-9]+$/i.test(value[i])) {
        break
      }
    }

    if (!foundItem && !!item) {
      setItem(null)
      setStartingCommand(null)
    }

    if (!foundItem && item === '') {
      setItem(null)
      setStartingCommand(null)
    }
  }

  const handleOnChange = ({ target: { value } }) => {
    if (errorMessage) {
      setErrorMessage('')
    }
    setMessage(value)
  }

  return (
    <div className={classes.ChatFooter}>
      <div className={classes.ChatFooter__inputContainer}>
        <InputField
          value={message}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onChange={handleOnChange}
          className={classes.InputContainer__inputField}
          inputProps={{
            ref: inputRef,
            className: classes.InputContainer__textField,
            maxLength: 120,
          }}
          placeholder={translate('chatFooter.enterAMessage')}
          error={!!errorMessage}
        />
        <IconButton
          className={classes.InputContainer__sendButton}
          onClick={sendMessage}
          color="tertiary"
          size="large"
        >
          <img src={SendIcon} alt="Send" />
        </IconButton>
      </div>

      <div className={classes.ChatFooter__actionContainer}>
        <Button
          className={classes.ActionContainer__actionButton}
          size="small"
          variant="text"
          label={translate('chatFooter.rain')}
          onClick={() => {
            setRainOpen(true)
          }}
          buttonTextProps={{
            fontWeight: 'fontWeightBold',
          }}
        />
        <Button
          className={classes.ActionContainer__actionButton}
          size="small"
          variant="text"
          label={translate('chatRules.title')}
          onClick={() => setRulesOpen(true)}
          buttonTextProps={{
            fontWeight: 'fontWeightBold',
          }}
        />
        {env.SEASONAL === 'true' ? (
          <>
            <div className={classes.EmojiMenu}>
              {/* eslint-disable i18next/no-literal-string */}
              <TempButton
                type="transparent"
                className={clsx(classes.EmojiMenu__button, {
                  [classes.EmojiMenu_selectedEmoji]: userStatus === '🎃',
                })}
                onClick={() => handleStatus('🎃')}
              >
                🎃
              </TempButton>
              <TempButton
                type="transparent"
                className={clsx(classes.EmojiMenu__button, {
                  [classes.EmojiMenu_selectedEmoji]: userStatus === '💀',
                })}
                onClick={() => handleStatus('💀')}
              >
                💀
              </TempButton>
              <TempButton
                type="transparent"
                className={clsx(classes.EmojiMenu__button, {
                  [classes.EmojiMenu_selectedEmoji]: userStatus === '👻',
                })}
                onClick={() => handleStatus('👻')}
              >
                👻
              </TempButton>
              <TempButton
                type="transparent"
                className={clsx(classes.EmojiMenu__button, {
                  [classes.EmojiMenu_selectedEmoji]: userStatus === '🦄',
                })}
                onClick={() => handleStatus('🦄')}
              >
                🦄
              </TempButton>
            </div>
          </>
        ) : null}
        <Typography
          variant="body4"
          className={classes.ActionContainer__characterCount}
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {message.length}/120
        </Typography>
      </div>

      {!!startingCommand && popupItems.length > 0 && (
        <Portal container={chatContainer.current}>
          <ChatPopup
            items={popupItems}
            onClick={name => {
              replaceItem(name)
            }}
            listItemTextProps={{
              primaryTypographyProps: {
                style: { fontSize: '0.75rem', lineHeight: '1rem' },
              },
              secondaryTypographyProps: {
                style: { fontSize: '0.75rem', lineHeight: '1rem' },
              },
            }}
            chatPopupState={chatPopupState}
            setChatPopupState={setChatPopupState}
          />
        </Portal>
      )}

      <RainDrawer
        open={rainOpen}
        setOpen={setRainOpen}
        buttonText={translate('rainDialog.startRain')}
        setErrorMessage={setErrorMessage}
      />

      <RulesDrawer open={rulesOpen} setOpen={setRulesOpen} />
    </div>
  )
}

export default React.memo(ChatFooter)
