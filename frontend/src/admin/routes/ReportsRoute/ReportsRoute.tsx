import React, { useState } from 'react'
import { TextField, Typography } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'

import { useAccessControl } from 'admin/hooks'
import { useUser } from 'common/hooks'

import { StatsByRange, UserByRange, UserCount } from './Reports'

import { useReportsRouteStyles } from './ReportsRoute.styles'

const reports = [
  {
    key: 'statsByRange',
    name: 'Stats By Range',
    component: <StatsByRange />,
  },
  {
    key: 'userByRange',
    name: 'User By Range',
    component: <UserByRange />,
  },
  {
    key: 'userCount',
    name: 'User Count',
    component: <UserCount />,
  },
] as const

export const ReportsRoute: React.FC = () => {
  const user = useUser()
  const classes = useReportsRouteStyles()
  const [currentReport, setCurrentReport] = useState('statsByRange')
  const { hasAccess: hasReportsAccess } = useAccessControl(['reports:read'])

  if (!hasReportsAccess) {
    return null
  }

  const renderReport = () => {
    return reports.find(elem => elem.key === currentReport)?.component ?? null
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h5" className={classes.title}>
          Show Report
        </Typography>

        <TextField
          select
          value={currentReport}
          variant="outlined"
          label="Report Type"
          size="small"
          className={classes.reportSelector}
          onChange={event => setCurrentReport(event.target.value)}
        >
          {reports.map(({ key, name }, index) => (
            <MenuItem key={key} value={key}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div className={classes.reportContainer}>{renderReport()}</div>
    </div>
  )
}
