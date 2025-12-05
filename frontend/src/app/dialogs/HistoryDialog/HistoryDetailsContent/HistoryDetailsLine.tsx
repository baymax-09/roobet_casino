import React from 'react'

import { useHistoryDetailDialogStyles } from '../HistoryDetailsDialog.styles'

interface HistoryDetailsLineProps {
  lineKey: string
  value: any
}

export const HistoryDetailsLine: React.FC<HistoryDetailsLineProps> = ({
  lineKey,
  value,
}) => {
  const classes = useHistoryDetailDialogStyles()

  return (
    <div className={classes.HistoryDetailDialog__id}>
      <span className={classes.HistoryDetailDialog__key}>{lineKey}: </span>
      <span className={classes.HistoryDetailDialog__value}>{value}</span>
    </div>
  )
}
