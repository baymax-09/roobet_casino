import React from 'react'
import ReactJson from 'react-json-view'

import { useAxiosGet } from 'common/hooks'
import { Loading } from 'mrooi'
import { useDarkMode } from 'admin/context'

import { type UserData } from '../types'

import { useBonusStyles } from './Bonus.styles'

interface BonusProps {
  userData: UserData
}

export const Bonus: React.FC<BonusProps> = ({ userData }) => {
  const classes = useBonusStyles()
  const [isDarkMode] = useDarkMode()

  const { user } = userData

  const [{ data, loading }] = useAxiosGet<object>(
    `/admin/users/calcBonus?userId=${user.id}`,
  )

  if (loading || !data) {
    return <Loading />
  }

  return (
    <div className={classes.root}>
      <ReactJson
        theme={isDarkMode ? 'monokai' : undefined}
        src={data}
        enableClipboard={false}
        indentWidth={4}
        displayObjectSize={false}
        displayDataTypes={false}
      />
    </div>
  )
}
