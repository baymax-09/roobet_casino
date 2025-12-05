import React from 'react'
import ReactJson from 'react-json-view'

import { useAxiosGet, useToasts } from 'common/hooks'
import { useDarkMode } from 'admin/context'

import { useBalanceReportStyles } from './BalanceReport.styles'

export const BalanceReport: React.FC = () => {
  const classes = useBalanceReportStyles()
  const [isDarkMode] = useDarkMode()
  const { toast } = useToasts()

  const [{ data }] = useAxiosGet('/admin/users/balanceReport', {
    onError: error =>
      error.response ? console.error(error) : toast.error(error.response.data),
  })

  return (
    <div className={classes.root}>
      <div className={classes.json}>
        <ReactJson
          theme={isDarkMode ? 'monokai' : undefined}
          src={data || {}}
          name="Current Balances USD"
        />
      </div>
    </div>
  )
}
