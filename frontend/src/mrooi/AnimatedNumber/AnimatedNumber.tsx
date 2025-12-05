import React from 'react'
import numeral from 'numeral'
import { useSpring, animated, config } from 'react-spring'

interface AnimatedNumberProps {
  format?: string
  lastValue?: number
  value?: number
  className?: string
  symbol?: string
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  format = '0,0',
  lastValue = 0,
  value = 0,
  className = undefined,
  symbol = '',
}) => {
  const animation = useSpring({
    config: config.slow,
    from: {
      number: lastValue,
    },

    number: value,
  })

  return (
    <animated.span className={className}>
      {animation.number.interpolate(
        number => `${symbol}${numeral(number).format(format)}`,
      )}
    </animated.span>
  )
}

export default React.memo(AnimatedNumber)
