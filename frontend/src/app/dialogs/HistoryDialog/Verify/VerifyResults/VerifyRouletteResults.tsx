import React from 'react'

import redImage from 'assets/images/colors-red.svg'
import blackImage from 'assets/images/colors-black.svg'
import goldImage from 'assets/images/colors-gold.svg'

interface VerifyRouletteResultsProps {
  results: {
    result: 1 | 2 | 3
  }
}

const VerifyRouletteResults: React.FC<VerifyRouletteResultsProps> = ({
  results,
}) => {
  return (
    <div style={{ width: 50, paddingTop: '5px' }}>
      {results.result === 1 && <img alt="red" src={redImage} />}
      {results.result === 2 && <img alt="black" src={blackImage} />}
      {results.result === 3 && <img alt="gold" src={goldImage} />}
    </div>
  )
}

export default React.memo(VerifyRouletteResults)
