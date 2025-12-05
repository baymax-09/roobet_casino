import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// @ts-expect-error assets need to be moved out of src
import starImage from 'app/routes/TowersRoute/resources/star.svg'

interface VerifyTowersResultsProps {
  results: {
    result: {
      deck: object
      columns: number
    }
  }
}

const VerifyTowersResults: React.FC<VerifyTowersResultsProps> = ({
  results,
}) => {
  const gameResultArr = Object.values(results.result.deck)

  return (
    <div>
      {gameResultArr
        .map((row, index) => (
          <div
            key={index}
            style={{ display: 'flex', width: 25 * results.result.columns }}
          >
            {Object.values(row).map((value, index) => (
              <div key={index} style={{ alignSelf: 'center' }}>
                {value === 'fruit' ? (
                  <img
                    alt="Star"
                    style={{ margin: 2, width: 20 }}
                    src={starImage}
                  />
                ) : (
                  <FontAwesomeIcon style={{ width: 20 }} icon="times" />
                )}
              </div>
            ))}
          </div>
        ))
        .reverse()}
    </div>
  )
}

export default React.memo(VerifyTowersResults)
