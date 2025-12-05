import { unionType } from 'nexus'

export const NotificationMessageType = unionType({
  name: 'NotificationMessage',
  definition(type) {
    type.members('Notification', 'Message')
  },
})
