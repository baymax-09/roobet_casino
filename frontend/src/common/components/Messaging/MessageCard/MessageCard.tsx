import React from 'react'
import { Card, CardContent } from '@mui/material'
import clsx from 'clsx'
import moment from 'moment'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { ChevronRight } from '@project-atl/ui/assets'

import { Link } from 'mrooi'
import { getCachedSrc } from 'common/util'

import { cardRootStyles, useMessagingStyles } from '../messaging.styles'

const MessageCardInner = ({
  message: { title, body, read, liveAt, heroImage, link },
}) => {
  const classes = useMessagingStyles({})

  return (
    <>
      <div
        className={classes.hero}
        style={{
          backgroundImage: `url(${getCachedSrc({
            src: heroImage,
            height: 120,
          })})`,
        }}
      />
      <div className={classes.content}>
        <div className={classes.copy}>
          <Typography
            variant="body3"
            color={uiTheme.palette.common.white}
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {title}
          </Typography>
          <Typography variant="body3" color={uiTheme.palette.neutral[300]}>
            {body}
          </Typography>
          <Typography
            variant="body5"
            color={uiTheme.palette.neutral[500]}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {moment(liveAt ?? moment()).fromNow()}
          </Typography>
        </div>
        {!!link && (
          <div className={classes.link}>
            <ChevronRight iconFill={uiTheme.palette.neutral[500]} />
          </div>
        )}
      </div>
    </>
  )
}

export const MessageCard = ({ message, onClick }) => {
  const linkPresent = message.link
  const classes = useMessagingStyles({ linkPresent, read: message.read })

  return (
    <Card
      onClick={onClick}
      className={clsx({
        [classes.hasLink]: !!message.link,
      })}
      sx={cardRootStyles({ linkPresent, read: message.read })}
    >
      <CardContent className={classes.container}>
        {linkPresent ? (
          <Link urlOrPath={message.link}>
            <MessageCardInner message={message} />
          </Link>
        ) : (
          <MessageCardInner message={message} />
        )}
      </CardContent>
    </Card>
  )
}
