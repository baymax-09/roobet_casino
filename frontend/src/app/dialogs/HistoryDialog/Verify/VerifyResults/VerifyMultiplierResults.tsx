import React from 'react'
import { Typography } from '@mui/material'

interface VerifyMultiplierResultsProps {
  results: {
    result: number
  }
}

const VerifyMultiplierResults: React.FC<VerifyMultiplierResultsProps> = ({
  results,
}) => {
  const multiplicationSymbol = 'x'
  return (
    <Typography variant="h6">
      {' '}
      {results.result}
      {multiplicationSymbol}
    </Typography>
  )
}

export default React.memo(VerifyMultiplierResults)
