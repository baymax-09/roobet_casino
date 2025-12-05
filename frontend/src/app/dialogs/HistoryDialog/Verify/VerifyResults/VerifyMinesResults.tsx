import React from 'react'

import bomb from 'assets/images/mines/bomb.svg'
import star from 'assets/images/mines/star.svg'

interface VerifyMinesResultsProps {
  results: {
    result: object
  }
}

const VerifyMinesResults: React.FC<VerifyMinesResultsProps> = ({ results }) => {
  const gameResultArr = Object.values(results.result)
  const gridSize = gameResultArr.length
  const tilesPerRow = Math.sqrt(gridSize)
  const containerWidth = tilesPerRow * 24

  return (
    <div style={{ width: containerWidth }}>
      {gameResultArr.map((value, index) => (
        <img
          alt="tile"
          key={index}
          style={{ margin: 2, width: 20 }}
          src={value === 'mine' ? bomb : star}
        />
      ))}
    </div>
  )
}

export default React.memo(VerifyMinesResults)
