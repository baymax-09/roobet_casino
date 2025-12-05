import gql from 'graphql-tag'

const MessageTemplateFragment = gql`
  fragment MessageTemplate on MessageTemplate {
    id
    name
    title
    body
    heroImage
    deleted
    deletedAt
    createdAt
    updatedAt
  }
`

export const MessageTemplateQuery = gql`
  ${MessageTemplateFragment}
  query MessageTemplate($id: ID!) {
    messageTemplate(id: $id) {
      ...MessageTemplate
    }
  }
`

export const MessageTemplatesQuery = gql`
  ${MessageTemplateFragment}
  query MessageTemplates($deleted: Boolean) {
    messageTemplates(deleted: $deleted) {
      ...MessageTemplate
    }
  }
`

export const MessageTemplateCreateMutation = gql`
  mutation MessageTemplateCreate($data: MessageTemplateCreateInput!) {
    messageTemplateCreate(data: $data) {
      id
    }
  }
`

export const MessageTemplateUpdateMutation = gql`
  ${MessageTemplateFragment}
  mutation MessageTemplateUpdate($data: MessageTemplateUpdateInput!) {
    messageTemplateUpdate(data: $data) {
      ...MessageTemplate
    }
  }
`

export const MessageTemplateDeleteMutation = gql`
  ${MessageTemplateFragment}
  mutation MessageTemplateDeleteMutation($data: MessageTemplateDeleteInput!) {
    messageTemplateDelete(data: $data) {
      ...MessageTemplate
    }
  }
`
export const MessageTemplateRestoreMutation = gql`
  ${MessageTemplateFragment}
  mutation MessageTemplateRestore($data: MessageTemplateRestoreInput!) {
    messageTemplateRestore(data: $data) {
      ...MessageTemplate
    }
  }
`

const MessageDetailedFragment = gql`
  fragment MessageDetailed on MessageDetailed {
    id
    title
    body
    heroImage
    featuredImage
    link
    logoImage
    recipientCount
    readCount
    live
    liveAt
    deleted
    deletedAt
    createdAt
    updatedAt
    recipients
  }
`

export const MessagesQuery = gql`
  ${MessageDetailedFragment}
  query Messages($live: Boolean!, $deleted: Boolean) {
    messages(live: $live, deleted: $deleted) {
      ...MessageDetailed
    }
  }
`
export const MessageQuery = gql`
  ${MessageDetailedFragment}
  query message($id: ID!) {
    message(id: $id) {
      ...MessageDetailed
    }
  }
`

export const MessageCreateMutation = gql`
  mutation MessageCreate($data: MessageCreateInput!) {
    messageCreate(data: $data) {
      id
    }
  }
`

export const MessageUpdateMutation = gql`
  ${MessageDetailedFragment}
  mutation messageupdate($data: MessageUpdateInput!) {
    messageUpdate(data: $data) {
      ...MessageDetailed
    }
  }
`

export const MessageDeleteMutation = gql`
  ${MessageDetailedFragment}
  mutation MessageDelete($data: MessageDeleteInput!) {
    messageDelete(data: $data) {
      ...MessageDetailed
    }
  }
`

export const MessageRestoreMutation = gql`
  ${MessageDetailedFragment}
  mutation MessageRestore($data: MessageRestoreInput!) {
    messageRestore(data: $data) {
      ...MessageDetailed
    }
  }
`

export const MessageSendMutation = gql`
  ${MessageDetailedFragment}
  mutation MessageSend($data: MessageSendInput!) {
    messageSend(data: $data) {
      ...MessageDetailed
    }
  }
`
