import React from 'react'

import { getCachedSrc } from 'common/util'
import vehicle from 'assets/images/provablyFair/linearmines/vehicle.png'
import road from 'assets/images/provablyFair/linearmines/road.png'

interface VerifyLinearMinesResultsProps {
  results: {
    result: object
  }
}

const VerifyLinearMinesResults: React.FC<VerifyLinearMinesResultsProps> = ({
  results,
}) => {
  const gameResultArr = Object.values(results.result)

  const bomb = getCachedSrc({ src: vehicle })
  const star = getCachedSrc({ src: road })

  return (
    <div>
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

export default React.memo(VerifyLinearMinesResults)
