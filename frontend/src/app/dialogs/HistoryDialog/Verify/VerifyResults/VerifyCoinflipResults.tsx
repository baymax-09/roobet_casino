import React from 'react'

import heads from 'assets/images/heads.svg'
import tails from 'assets/images/tails.svg'

interface VerifyCoinflipResultsProps {
  results: {
    result: 'heads' | 'tails'
  }
}

const VerifyCoinflipResults: React.FC<VerifyCoinflipResultsProps> = ({
  results,
}) => {
  return (
    <div style={{ width: 50, paddingTop: '5px' }}>
      {results.result === 'heads' && <img alt="heads" src={heads} />}
      {results.result === 'tails' && <img alt="tails" src={tails} />}
    </div>
  )
}

export default React.memo(VerifyCoinflipResults)
