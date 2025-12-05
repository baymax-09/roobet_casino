import React from 'react'

import { UserUpdateContext } from '../components/UserProvider/UserContext'

export function useUserUpdate() {
  const context = React.useContext(UserUpdateContext)
  return context
}
