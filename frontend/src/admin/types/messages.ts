import { type MUIDataTableColumn } from 'mui-datatables'

type MessageMutation = ({
  variables: {
    data: { id },
  },
}) => void

export interface MessageTabData {
  label: string
  columns: ({
    deleteDraft,
    restoreDraft,
    unsendMessage,
  }: {
    deleteDraft: MessageMutation
    restoreDraft: MessageMutation
    unsendMessage: MessageMutation
  }) => MUIDataTableColumn[]
}
