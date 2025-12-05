import React from 'react'
import { useImmerReducer } from 'use-immer'
import { useLocation, useHistory } from 'react-router-dom'
import { ThemeProvider, StyledEngineProvider } from '@mui/material'
import { useSelector } from 'react-redux'

import { lightTheme } from 'common/theme'
import { urlSearchParamsToMap } from 'common/util'
import { useAppReady } from 'app/hooks/useAppReady'
import { useIsLoggedIn } from 'app/hooks/useIsLoggedIn'
import { getStorageItem, isPrerenderIo, removeStorageItem } from 'app/util'
import { getDialog, possiblyGetDialog, type DialogKey } from 'app/dialogs/util'

export const DialogContextActions = {
  Open: 'dialogs/open',
  Close: 'dialogs/close',
  Remove: 'dialogs/remove',
  Update: 'dialogs/update',
}

/** @todo narrow types */
interface ActiveDialog {
  key: DialogKey
  id: `${number}`
  data: object
  link: object
  open: boolean
  options: object
  props: object
}

interface ActiveDialogState {
  active: ActiveDialog[]
}

const initialState: ActiveDialogState = {
  active: [],
}

export const DialogsStateContext =
  React.createContext<ActiveDialogState>(initialState)
/** @todo narrow Dispatch type */
export const DialogsDispatchContext = React.createContext<
  React.Dispatch<any> | undefined
>(undefined)
export const DialogsCurrentContext = React.createContext<
  ActiveDialog | undefined
>(undefined)

let nextGeneratedDialogId = 0

function dialogsReducer(draftState, action) {
  switch (action.type) {
    case DialogContextActions.Open: {
      if (action.payload.options.replace) {
        for (const i in draftState.active) {
          draftState.active[i].open = false
        }
      }

      // Don't open if already open
      const index = draftState.active.findIndex(
        ({ key }) => key === action.payload.key,
      )
      if (index > -1) {
        draftState.active[index].open = false
      }

      const id = (++nextGeneratedDialogId).toString()
      draftState.active.push({
        data: {},
        ...action.payload,

        id,
        link: {},
        open: true,
      })
      break
    }
    case DialogContextActions.Close: {
      if (action.payload) {
        for (const key in draftState.active) {
          if (draftState.active[key].id === action.payload) {
            draftState.active[key].open = false
            break
          }
        }
      } else {
        for (const key in draftState.active) {
          draftState.active[key].open = false
        }
      }
      break
    }
    case DialogContextActions.Remove: {
      draftState.active = draftState.active.filter(
        dialog => dialog.id !== action.payload,
      )
      break
    }
    case DialogContextActions.Update: {
      for (let i = 0; i < draftState.active.length; i++) {
        const a = draftState.active[i]

        if (a.id === action.payload.id) {
          action.payload.update(a)
          break
        }
      }
      break
    }
    default:
  }
}

export function DialogsProvider({ children }) {
  // TODO add second type param to useImmerReducer
  const [state, dispatch] = useImmerReducer<ActiveDialogState>(
    dialogsReducer,
    initialState,
  )
  const location = useLocation()
  const previousLocation = React.useRef(null)
  const hasOpened = state.active.length > 0
  const isAppReady = useAppReady()
  const isLoggedIn = useIsLoggedIn()
  const [regionRestrictedDismissed, setRegionRestrictedDismissed] =
    React.useState(false)
  const history = useHistory()

  const regionRestricted = useSelector(({ settings }) =>
    !isPrerenderIo() ? settings?.restrictedRegion : false,
  )
  const countryCode = useSelector(
    ({ settings }) => settings?.countryCode ?? null,
  )
  const regionCountryCode = useSelector(
    ({ settings }) => settings?.regionCountryCode ?? null,
  )
  const mustSetName = useSelector(({ user }) => user?.mustSetName)
  const emailVerified = useSelector(({ user }) => user?.emailVerified)

  const urlQuery = new URLSearchParams(window.location.search)
  const twofactorRequired = !isLoggedIn && urlQuery.has('twofactorRequired')
  const twofactorEmail = !isLoggedIn && urlQuery.has('twofactorEmail')
  const confirmAccountLink = !isLoggedIn && urlQuery.has('confirmAccountLink')
  const confirmSignup = !isLoggedIn && urlQuery.has('confirmSignup')
  const provider = urlQuery.get('provider')
  const uniqueId = urlQuery.get('uniqueId')
  const userId = urlQuery.get('userId')
  const accessToken = urlQuery.get('accessToken')
  const name = urlQuery.get('name')

  React.useEffect(() => {
    if (!isAppReady) {
      return
    }

    if (!hasOpened) {
      if (mustSetName) {
        dispatch({
          type: DialogContextActions.Open,
          payload: {
            key: 'auth',
            options: {},
            props: {
              tab: 'setUsername',
            },
          },
        })
        window.dataLayer.push({
          event: 'dialog',
          dialog: 'auth',
        })
      } else if (!regionRestrictedDismissed && regionRestricted) {
        const regionRestrictionTimer = setTimeout(() => {
          dispatch({
            type: DialogContextActions.Open,
            payload: {
              key: 'regionRestricted',
              options: {},
            },
          })
          window.dataLayer.push({
            event: 'dialog',
            dialog: 'regionRestricted',
            isLoggedIn,
            regionRestricted,
          })
        }, 1000)
        return () => clearTimeout(regionRestrictionTimer)
      } else if (twofactorRequired || twofactorEmail) {
        dispatch({
          type: DialogContextActions.Open,
          payload: {
            key: twofactorEmail ? 'twofactorEmail' : 'twofactorVerify',
            options: {},
            props: {},
          },
        })
        window.dataLayer.push({
          event: 'dialog',
          dialog: 'twofactorVerify',
        })
      } else if (confirmSignup) {
        dispatch({
          type: DialogContextActions.Open,
          payload: {
            key: 'confirmSignup',
            options: {},
            props: {
              query: new URLSearchParams(window.location.search).toString(),
            },
          },
        })
        window.dataLayer.push({
          event: 'dialog',
          dialog: 'confirmSignup',
        })
      } else if (confirmAccountLink && provider && uniqueId && userId) {
        dispatch({
          type: DialogContextActions.Open,
          payload: {
            key: 'confirmAccountLink',
            options: {},
            props: {
              provider,
              uniqueId,
              userId,
              accessToken,
              name,
            },
          },
        })
        window.dataLayer.push({
          event: 'dialog',
          dialog: 'confirmAccountLink',
        })
      }
    }
  }, [
    regionRestrictedDismissed,
    hasOpened,
    dispatch,
    isAppReady,
    regionRestricted,
    mustSetName,
    isLoggedIn,
    emailVerified,
    countryCode,
    regionCountryCode,
    twofactorRequired,
    twofactorEmail,
    confirmAccountLink,
    provider,
    uniqueId,
    userId,
    accessToken,
    name,
    confirmSignup,
  ])

  React.useEffect(() => {
    if (!isAppReady || (!isLoggedIn && regionRestricted)) {
      return
    }

    if (location !== previousLocation.current) {
      const search = new URLSearchParams(location.search)
      const params = urlSearchParamsToMap(search)
      const modal = search.get('modal')
      const dialog = possiblyGetDialog(modal)

      if (!hasOpened && dialog) {
        if (dialog.options.requiresAuth && !isLoggedIn) {
          dispatch({
            type: DialogContextActions.Open,
            payload: {
              key: 'auth',
              options: {},
              props: {},
              data: {
                continue: {
                  dialog: modal,
                  options: {
                    params,
                  },
                },
              },
            },
          })

          return
        }

        dispatch({
          type: DialogContextActions.Open,
          payload: {
            key: modal,
            options: {},
            props: params,
          },
        })
      }
    }

    previousLocation.current = location
  }, [dispatch, hasOpened, location, isAppReady, isLoggedIn, regionRestricted])

  const onDialogClose = React.useCallback(() => {
    const { id, key } = state.active[state.active.length - 1]

    if (key === 'regionRestricted') {
      setRegionRestrictedDismissed(true)
    }

    if (key === 'auth') {
      // If user logins/registers from the Japanese homepage, redirect to main site
      if (history.location.pathname.includes('/jp')) {
        history.push('/')
      }
      // If RedirectURL exists, avoid the dialog close and redirect
      const { redirectURL } = JSON.parse(getStorageItem('redirectInfo') || '{}')
      if (redirectURL) {
        removeStorageItem('redirectInfo')
        window.location.assign(redirectURL)
        return
      }
    }

    dispatch({
      type: DialogContextActions.Close,
      payload: id,
    })

    window.dataLayer.push({
      event: 'closeDialog',
      dialog: key,
    })
  }, [state.active, dispatch])

  const onDialogExit = React.useCallback(
    dialogId =>
      dispatch({
        type: DialogContextActions.Remove,
        payload: dialogId,
      }),
    [state.active, dispatch],
  )

  return (
    <DialogsStateContext.Provider value={state}>
      <DialogsDispatchContext.Provider value={dispatch}>
        {children}

        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={lightTheme}>
            {state.active.map(dialog => {
              const DialogComponent = getDialog(dialog.key).component

              if (!DialogComponent) {
                return null
              }

              return (
                <DialogsCurrentContext.Provider key={dialog.id} value={dialog}>
                  <DialogComponent
                    params={dialog.props}
                    data={dialog.data}
                    DialogProps={{
                      open: dialog.open,
                      onClose: onDialogClose,
                      TransitionProps: {
                        onExited: () => onDialogExit(dialog.id),
                      },
                    }}
                  />
                </DialogsCurrentContext.Provider>
              )
            })}
          </ThemeProvider>
        </StyledEngineProvider>
      </DialogsDispatchContext.Provider>
    </DialogsStateContext.Provider>
  )
}
