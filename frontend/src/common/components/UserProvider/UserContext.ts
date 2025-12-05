import React from 'react'

import { type User } from 'common/types'

export const UserStateContext = React.createContext()
export const UserUpdateContext =
  React.createContext<(callback: (user: User) => void) => void>()
