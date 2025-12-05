import React from 'react'

export const CrashStateContext = React.createContext()
export const CrashDispatchContext = React.createContext()

export const CrashProvider = React.memo(props => {
  const { autoCashoutState, updateAutoCashoutState } = props

  return (
    <CrashStateContext.Provider value={autoCashoutState}>
      <CrashDispatchContext.Provider value={updateAutoCashoutState}>
        {props.children}
      </CrashDispatchContext.Provider>
    </CrashStateContext.Provider>
  )
})
