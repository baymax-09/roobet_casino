import React from 'react'
import { connect } from 'react-redux'
import { withTranslation } from 'react-i18next'

import { VirtualScroll } from 'app/components'

import ColorsBet from './ColorsBet'

import style from './style.scss'

const ColorsBetsView = ({
  engine,
  bets,
  t: translate,
  inProgress,
  gameOver,
}) => {
  const [containerHeight, setContainerHeight] = React.useState(100)
  const containerRef = React.useRef(null)
  const virtualScrollRef = React.useRef(null)

  const onResize = () => {
    if (containerRef.current?.clientHeight) {
      setContainerHeight(containerRef.current.clientHeight)
    }
  }

  React.useEffect(() => {
    window.addEventListener('resize', onResize)
    return window.removeEventListener('resize', onResize)
  }, [])

  const scrollList = event => {
    if (virtualScrollRef.current) {
      virtualScrollRef.current.scrollHook(event.target)
    }
  }

  const contentRenderer = (rowStyles, fromRow, toRow, parentStyles) => {
    const generatedRows: JSX.Element[] = []

    for (let i = fromRow; i < toRow; i++) {
      const bet = bets[i]

      if (!bet) {
        continue
      }

      generatedRows.push(
        <div style={rowStyles} key={bet.id}>
          <ColorsBet
            gameOver={gameOver}
            betAmount={bet.betAmount}
            betSelection={bet.betSelection}
            balanceType={bet.balanceType}
            incognito={bet.incognito}
            user={bet.user}
            winningNumber={engine.winningNumber}
          />
        </div>,
      )
    }

    return (
      <div className={style.colorsBets} style={parentStyles}>
        {generatedRows}
      </div>
    )
  }

  const containerRefCallback = elem => {
    containerRef.current = elem
    onResize()
  }

  return (
    <div
      ref={containerRefCallback}
      className={style.ColorsBetsContainer}
      onScroll={scrollList}
    >
      {!bets.length && (
        <div className={style.emptyBets}>
          <div>{translate('colorsBets.betsNotPlacedText')}</div>
        </div>
      )}

      <VirtualScroll
        ref={virtualScrollRef}
        rows={bets}
        scrollContainerHeight={containerHeight}
        totalNumberOfRows={bets.length}
        rowHeight={30}
        rowRenderer={contentRenderer}
      />
    </div>
  )
}

export const ColorsBets = connect(({ colors }) => ({
  gameOver: colors.state === 'Over',
  inProgress: colors.state === 'Running',
  bets: colors.bets,
  winningNumber: colors.winningNumber,
  colors,
}))(withTranslation()(ColorsBetsView))
