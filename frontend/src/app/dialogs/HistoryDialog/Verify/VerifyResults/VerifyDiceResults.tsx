import { Typography } from '@mui/material'
import React from 'react'

interface VerifyDiceResultsProps {
  results: {
    result: string
  }
}

const VerifyDiceResults: React.FC<VerifyDiceResultsProps> = ({ results }) => {
  return <Typography variant="h6">{results.result}</Typography>
}

export default React.memo(VerifyDiceResults)
