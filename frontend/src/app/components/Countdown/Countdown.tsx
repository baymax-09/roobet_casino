import React from 'react'
import ReactCountdown from 'react-countdown'
import moment from 'moment'

import {
  CountdownRenderer,
  type CountdownRendererProps,
} from './CountdownRenderer'

import { useCountdownStyles } from './Countdown.styles'

export interface SlotPotatoCountdownBannerProps {
  startDateTime: Date
  handleCompleteCountdown: () => void
  countdownText?: string
  countdownRenderedProps: Omit<CountdownRendererProps, 'formatted'>
}

const Countdown: React.FC<SlotPotatoCountdownBannerProps> = ({
  startDateTime: startDateTimeProp,
  handleCompleteCountdown,
  countdownRenderedProps,
}) => {
  const classes = useCountdownStyles()

  const startDateTime = startDateTimeProp

  return (
    <div className={classes.Countdown}>
      <ReactCountdown
        onComplete={() => {
          handleCompleteCountdown()
        }}
        date={moment(startDateTime).unix() * 1000}
        renderer={props => (
          <CountdownRenderer {...props} {...countdownRenderedProps} />
        )}
      />
    </div>
  )
}

export default Countdown
