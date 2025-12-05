import React from 'react'
import ReactJson from 'react-json-view'

import { useAxiosGet, useToasts } from 'common/hooks'
import { useDarkMode } from 'admin/context'

import { useUserCountStyles } from './UserCount.styles'

export const UserCount: React.FC = () => {
  const classes = useUserCountStyles()
  const [isDarkMode] = useDarkMode()
  const { toast } = useToasts()

  const [{ data: currentReportData }] = useAxiosGet('/admin/stats/userCount', {
    onError: error => {
      error.response ? console.error(error) : toast.error(error.response.data)
    },
  })

  return (
    <div className={classes.root}>
      <div className={classes.json}>
        <ReactJson
          theme={isDarkMode ? 'monokai' : undefined}
          src={currentReportData || {}}
          name="User Count"
        />
      </div>
    </div>
  )
}
