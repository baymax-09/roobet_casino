import React from 'react'
import { Message, Typography, theme as uiTheme } from '@project-atl/ui'
import { useSelector } from 'react-redux'
import { Close } from '@project-atl/ui/assets'

import { getBalanceTypeIcon } from 'common/util/crypto'
import { type BalanceType } from 'common/types'
import { useTranslate } from 'app/hooks'
import { ProfileName } from 'app/components'
import { env } from 'common/constants'

import { Currency } from '../DisplayCurrency'

import { useChatMessageStyles } from './ChatMessage.styles'

interface ChatUser {
  id: string
  name: string
  hasChatModBadge: boolean
  hasChatDevBadge: boolean
}

export interface MessageType {
  amount: number
  balance: number
  balanceType: BalanceType
  id: string
  message: string
  toUserId: string
  toUserName: string
  type: string
  user: ChatUser
  userId: string
  userStatus: string
}

interface ChatMessageProps {
  message: MessageType
  onDelete: (id: string) => void
  canDeleteMessages: boolean
}

interface MessageContentProps {
  message: MessageType
}

const BalanceMessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const translate = useTranslate()
  const username = useSelector(({ user }) => user?.name ?? null)
  const classes = useChatMessageStyles({ username })
  const { balanceType, balance } = message

  return (
    <div className={classes.ChatMessage__wrapper}>
      <Typography
        className={classes.ChatMessage__message}
        variant="body2"
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        {translate('chatMessage.balance')}:
      </Typography>
      <img
        className={classes.BottomContainer__icon}
        alt={balanceType}
        src={getBalanceTypeIcon(balanceType)}
      />
      <Typography
        variant="body2"
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        <Currency amount={balance} format="0,0.00[0]" />
      </Typography>
    </div>
  )
}

const HarlemShakeMessageContent: React.FC = () => {
  const username = useSelector(({ user }) => user?.name ?? null)
  const classes = useChatMessageStyles({ username })
  // This is not localized, since it's a meme
  const harlemShakeText = 'Harlem Shaking'

  return (
    <div className={classes.ChatMessage__shake}>
      <Typography
        className={classes.ChatMessage__message}
        variant="body2"
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        {harlemShakeText}
      </Typography>
    </div>
  )
}

const DefaultMessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const username = useSelector(({ user }) => user?.name ?? null)
  const classes = useChatMessageStyles({ username })

  return (
    <>
      {env.SEASONAL === 'true' && message.userStatus
        ? message.userStatus
        : null}
      <span className={classes.ChatMessage__message}>
        <span dangerouslySetInnerHTML={{ __html: message.message }} />
      </span>
    </>
  )
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const { type } = message

  if (type === 'balance') {
    return <BalanceMessageContent message={message} />
  } else if (type === 'shake') {
    return <HarlemShakeMessageContent />
  }
  return <DefaultMessageContent message={message} />
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onDelete,
  canDeleteMessages,
}) => {
  const translate = useTranslate()
  const name = useSelector(({ user }) => user?.name ?? null)
  const userId = useSelector(({ user }) => user?.id ?? null)

  const classes = useChatMessageStyles({ username: name })

  const { type, balanceType, amount: messageAmount, balance } = message

  const amount = type === 'tip' ? messageAmount : balance

  return (
    <div className={classes.ChatMessage}>
      <Message
        message={
          <>
            {type !== 'tip' && <MessageContent message={message} />}
            {canDeleteMessages && (
              <Close
                className={classes.ChatMessage__deleteIcon}
                onClick={() => onDelete(message.id)}
              />
            )}
          </>
        }
        prefixMessage={
          <ProfileName
            userName={message.user.name}
            hasChatModBadge={message.user.hasChatModBadge}
            hasChatDevBadge={message.user.hasChatDevBadge}
            addText=":"
            sx={{
              typography: 'body2',
              color: 'neutral.300',
              fontWeight: 'fontWeightBold',
              wordBreak: 'break-word',
            }}
          />
        }
        {...(type === 'tip' && {
          bottomContainer: (
            <>
              <Typography
                variant="body4"
                fontWeight={uiTheme.typography.fontWeightMedium}
              >
                {translate('chatMessage.sentTip')}
              </Typography>
              <div className={classes.ChatMessage__bottomContainer}>
                <>
                  <img
                    className={classes.BottomContainer__icon}
                    alt={balanceType}
                    src={getBalanceTypeIcon(balanceType)}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={uiTheme.typography.fontWeightMedium}
                    color={uiTheme.palette.success[500]}
                  >
                    +<Currency amount={amount} format="0,0.00[0]" />
                  </Typography>
                  <>
                    <Typography
                      variant="body2"
                      fontWeight={uiTheme.typography.fontWeightMedium}
                      color={uiTheme.palette.common.white}
                    >
                      {translate('chatMessage.to')}
                    </Typography>
                    <ProfileName
                      className={
                        message?.toUserId === userId
                          ? classes.ChatMessage__mention
                          : classes.ChatMessage__message
                      }
                      userName={message.toUserName}
                      mention={true}
                    />
                  </>
                </>
              </div>
            </>
          ),
        })}
      />
    </div>
  )
}

export default React.memo(ChatMessage)
