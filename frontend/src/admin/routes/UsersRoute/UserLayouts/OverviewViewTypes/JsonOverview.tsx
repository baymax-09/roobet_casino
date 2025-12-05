import React from 'react'
import ReactJson from 'react-json-view'

import { useDarkMode } from 'admin/context'

import { type UserData } from '../../types'

import { useJsonOverviewStyles } from './JsonOverview.styles'

interface JsonOverviewProps {
  userData: UserData
}

export const JsonOverview: React.FC<JsonOverviewProps> = ({ userData }) => {
  const classes = useJsonOverviewStyles()
  const [isDarkMode] = useDarkMode()

  return (
    <div className={classes.root}>
      <ReactJson
        theme={isDarkMode ? 'monokai' : undefined}
        src={userData.user}
        enableClipboard={false}
        indentWidth={4}
        displayObjectSize={false}
        displayDataTypes={false}
      />
    </div>
  )
}
