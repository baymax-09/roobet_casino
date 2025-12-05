// This file cannot export * since there are overlapping symbols (schema).
export {
  type MessageTemplateDocument,
  getMessageTemplate,
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  restoreMessageTemplate,
  softDeleteMessageTemplate,
} from './messageTemplate'

export {
  getMessage,
  getMessages,
  createMessage,
  updateMessage,
  restoreMessage,
  softDeleteMessage,
  getMessagesForUserId,
  markMessagesAsRead,
} from './message'

export * as Message from './message'
export * as MessageReadReceipt from './messageReadReceipt'
export * as MessageTemplate from './messageTemplate'
