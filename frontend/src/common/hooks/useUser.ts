import React from 'react'

import { type User } from 'common/types'

import { UserStateContext } from '../components/UserProvider/UserContext'

export function useUser() {
  const user = React.useContext(UserStateContext)

  // TS: This should come from the context, but those need to be re-written correctly.
  return user as User
}
