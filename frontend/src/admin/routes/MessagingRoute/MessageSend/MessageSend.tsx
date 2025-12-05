import { useMutation, useQuery } from '@apollo/client'
import React from 'react'
import { useHistory } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControlLabel,
  List,
  ListItem,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import clsx from 'clsx'
import moment from 'moment'

import { DateTimePicker, TitleContainer, useTitleContainerStyles } from 'mrooi'
import { MessageQuery } from 'admin/gql'
import { MessageCard } from 'common/components'
import { useToasts } from 'common/hooks'
import { MessageSendMutation } from 'admin/gql/messaging'
import { coerceDateToUTCString } from 'common/util'

import { useMessageSentStyles } from './MessageSend.styles'

interface MessageSendProps {
  match: {
    params: {
      id: string
    }
  }
}

export const MessageSend: React.FC<MessageSendProps> = ({ match }) => {
  const history = useHistory()
  const { toast } = useToasts()

  const onError = error => {
    toast.error(error.message)
  }

  const [sendAt, setSendAt] = React.useState<Date | undefined>(undefined)

  const classes = {
    ...useMessageSentStyles(),
    ...useTitleContainerStyles(),
  }

  const { id } = match.params

  const { data } = useQuery(MessageQuery, {
    variables: { id },
    onError,
    onCompleted: data => {
      if (!data.message) {
        toast.error('Could not find draft.')
        history.push('/messaging/mailbox')
        return
      }

      if (data.message.live) {
        toast.error('Message has already been sent.')
        history.push('/messaging/mailbox')
      }
    },
  })

  const [messageSend] = useMutation(MessageSendMutation, {
    // Do not update cache, causes the error toast above to render.
    fetchPolicy: 'no-cache',
    onError,
    onCompleted: result => {
      if (!result.messageSend) {
        return
      }

      if (result.messageSend?.id) {
        if (sendAt) {
          toast.success(
            `Message scheduled to be sent at ${coerceDateToUTCString(sendAt)}!`,
          )
        } else {
          toast.success('Message sent!')
        }
      }

      history.push('/messaging/mailbox')
    },
  })

  const message = data?.message ?? {}

  return (
    <TitleContainer
      title="Send Message"
      returnTo={{
        title: 'Messages',
        link: '/messaging/mailbox',
      }}
      actions={() => [
        {
          value: 'Edit Draft',
          variant: 'outlined',
          onClick: () => {
            history.push(`/messaging/mailbox/${message.id}`)
          },
        },
        {
          value: 'Send Message',
          onClick: () =>
            messageSend({
              variables: {
                data: {
                  id: message.id,
                  liveAt: sendAt && coerceDateToUTCString(sendAt),
                },
              },
            }),
        },
      ]}
    >
      {message.id && (
        <div className={classes.formContainer}>
          <div className={classes.section}>
            <Typography variant="h5" color="textPrimary">
              Send At
            </Typography>
            <RadioGroup className={classes.sendAtRadio}>
              <FormControlLabel
                value="0"
                control={
                  <Radio
                    checked={sendAt === undefined}
                    onChange={() => setSendAt(undefined)}
                  />
                }
                label="Now"
              />
              <FormControlLabel
                value="1"
                control={
                  <Radio
                    checked={sendAt !== undefined}
                    onChange={() => setSendAt(new Date())}
                  />
                }
                label="Scheduled"
              />
            </RadioGroup>
            {sendAt && (
              <DateTimePicker
                className={classes.sendAtDate}
                label="Send At"
                disablePast={true}
                value={moment(sendAt)}
                onChange={value => setSendAt(value?.toDate())}
              />
            )}
          </div>
          <div className={clsx(classes.section, classes.recipients)}>
            <Typography variant="h5" color="textPrimary">
              Recipients
            </Typography>
            This message will be sent to{' '}
            {message.recipients.length === 0
              ? 'ALL'
              : message.recipients.length}{' '}
            users.
            {message.recipients.length > 0 && (
              <Accordion square elevation={0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>View Recipients</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {message.recipients.map(id => (
                      <ListItem key={id}>{id}</ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </div>
          <div className={classes.section}>
            <Typography variant="h5" color="textPrimary">
              Preview
            </Typography>
            <div className={classes.preview}>
              <MessageCard message={message} />
            </div>
          </div>
        </div>
      )}
    </TitleContainer>
  )
}
