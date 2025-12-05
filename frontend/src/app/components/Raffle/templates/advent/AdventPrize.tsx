import React from 'react'
import clsx from 'clsx'

import { useAdventPrizeStyles } from './AdventPrize.styles'

interface AdventPrizeProps {
  disabled?: boolean
  className?: string
  prize: Record<string, any>
  opened?: boolean
  onClick?: () => void
  focused: boolean
}

const AdventPrize: React.FC<AdventPrizeProps> = ({
  prize,
  className,
  opened,
  disabled,
  onClick,
  focused,
}) => {
  const classes = useAdventPrizeStyles({
    opened: !!opened,
    day: prize.index,
    gridArea: prize.area,
  })

  const _onClick = () => {
    if (disabled) {
      return
    }

    if (typeof onClick === 'function') {
      onClick()
    }
  }

  return (
    <div
      onClick={_onClick}
      className={clsx(classes.AdventPrize, className, {
        [classes.AdventPrize_disabled]: disabled,
      })}
    >
      {focused && <div className={classes.RaysContainer__rays} />}
      <div className={classes.AdventPrize__claimPrize} />
    </div>
  )
}

export default React.memo(AdventPrize)
