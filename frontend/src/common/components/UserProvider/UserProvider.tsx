import React from 'react'
import { useImmer } from 'use-immer'

import { UserStateContext, UserUpdateContext } from './UserContext'

export function UserProvider(props) {
  const [user, updateUser] = useImmer(props.defaultUser)

  return (
    <UserUpdateContext.Provider value={updateUser}>
      <UserStateContext.Provider value={user}>
        {props.children}
      </UserStateContext.Provider>
    </UserUpdateContext.Provider>
  )
}
