import React from 'react'
import { useUpdateEffect } from 'react-use'
import { Helmet } from 'react-helmet-async'
import {
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  type Theme,
} from '@mui/material'
import { FileCopy } from '@mui/icons-material'
import { Controller, useForm } from 'react-hook-form'
import { useHistory } from 'react-router'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import { api, urlSearchParamsToMap } from 'common/util'
import { useUser, useUserUpdate, useToasts } from 'common/hooks'
import { UserActions } from 'admin/routes/UsersRoute/Dialogs/ActionsDialog/UserActions'
import { type User, type Lookup } from 'common/types'

import { AdminLookupsDialog } from './Dialogs/AdminLookupsDialog'
import { INDEX_TYPES, getSelectableViews } from './views'
import { UserNameSearch } from './UserLayouts'

import { useUsersRouteStyles } from './UsersRoute.styles'

interface LookupSession {
  userId: string
  dupeId: number
  data: any
  title: string
  id: string
  state: object
}

interface NameLookupUser {
  email: string
  username: string
  firstName: string
  lastName: string
  userId: string
}

interface LookupData {
  user: User
  banStatus: unknown
}

export const UsersRoute: React.FC = React.memo(() => {
  const lastSessionKey = React.useRef(1)
  const history = useHistory()
  const { toast } = useToasts()
  const query = React.useMemo(() => {
    const search = new URLSearchParams(history.location.search)
    return urlSearchParamsToMap(search)
  }, [history.location.search])

  const classes = useUsersRouteStyles()
  const user = useUser()
  const adminLookups = user.adminLookups || []
  const updateUser = useUserUpdate()
  const isDesktop = useMediaQuery<Theme>(theme => theme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [sessions, updateSessions] = React.useState<LookupSession[]>([])
  const [busy, setBusy] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const [tab, setTab] = React.useState(0)
  const [linkParams, updateLinkParams] =
    React.useState<Record<string, string>>(query)
  const [nameLookup, setNameLookup] = React.useState<NameLookupUser[] | null>(
    null,
  )

  const activeSession = sessions && sessions[tab] ? sessions[tab] : null

  const { register, handleSubmit, setError, errors, watch, setValue, control } =
    useForm({
      defaultValues: {
        index: query.index || 'nameLowercase',
        key: query.key,
      },
    })

  // Watched form values.
  const key = watch('key')
  const index = watch<'index', Lookup['index']>('index')

  const selectableViews = React.useMemo(() => getSelectableViews(user), [user])
  const activeIndex = React.useMemo(() => {
    return INDEX_TYPES.reduce(
      (it, i) => (i.key === index ? i : it),
      INDEX_TYPES[0],
    )
  }, [index])

  // Redirect to overview page if dropdown is not specified.
  React.useEffect(() => {
    if (!query.userDropdown) {
      updateLinkParams(prev => ({
        ...prev,
        userDropdown: 'overview',
      }))
    }
  }, [query.userDropdown])

  // Load user from values specified in query if available.
  React.useEffect(() => {
    const { userId, key, index } = query

    if (index && key) {
      onLookup({
        index,
        key,
      })
      return
    }

    // Support old links.
    if (userId) {
      onLookup({
        index: 'id',
        key: userId,
      })
    }
  }, [query.userId, query.key, query.index])

  // Write admin lookups to database.
  useUpdateEffect(() => {
    api.post('admin/saveLookups', {
      adminLookups,
    })
  }, [adminLookups])

  // Push query params to history.
  React.useEffect(() => {
    const newUrl = `/users?${new URLSearchParams(linkParams)}`

    history.push(newUrl)
  }, [linkParams])

  const updateActiveSessionData = React.useCallback(
    updateFn => {
      const activeSession = sessions[tab]
      if (!activeSession) {
        return
      }

      updateSessions(prevSessions => {
        updateFn(prevSessions[tab].data)
        return prevSessions
      })
    },
    [tab, sessions, updateSessions],
  )

  const renderSelectedView = key => {
    const view = !isArchivedUser
      ? selectableViews.find(view => view.key === key)
      : selectableViews.find(view => view.key === key && view.isAvailable)

    if (!view) {
      return null
    }

    return view.render({
      user,
      activeSession,
      updateActiveSessionData,
      refreshSession,
    })
  }

  const addLookupName = (id, key) => {
    const pair = {
      key,
      id,
      index: 'nameLowercase',
    }

    const newLookups = adminLookups
      .slice(0)
      .filter(lookup => lookup.key !== key)

    newLookups.unshift(pair)

    if (newLookups.length > 10) {
      newLookups.splice(10)
    }

    updateUser(user => {
      if (!user) {
        return
      }

      user.adminLookups = newLookups
    })
  }

  const getDuplicateCountForUserId = userId => {
    let id = -1

    while (true) {
      id++

      let exists = false

      for (const session of sessions) {
        if (session.userId === userId && session.dupeId === id) {
          exists = true
          break
        }
      }

      if (!exists) {
        break
      }
    }

    return id
  }

  const onNameLookup = async name => {
    setBusy(true)
    try {
      const users = await api.get<unknown, NameLookupUser[]>(
        '/admin/user/nameLookup',
        {
          params: {
            name,
          },
        },
      )
      setNameLookup(users)
    } catch (err) {
      setError('key', {
        type: 'manual',
        message:
          err instanceof Error && 'message' in err
            ? err.message
            : 'Unknown error',
      })
    } finally {
      setBusy(false)
    }
  }

  const onLookup = async ({ index, key }: Lookup) => {
    if (index === 'nameLowercase') {
      key = key.toLowerCase()
    }
    if (index === 'name') {
      return await onNameLookup(key)
    }
    setBusy(true)

    try {
      const lookupResult = await api.get<unknown, LookupData>(
        '/admin/user/lookup',
        {
          params: {
            index,
            key,
          },
        },
      )
      lookupResult.banStatus = lookupResult.banStatus || {}
      addLookupName(lookupResult.user.id, lookupResult.user.name)

      updateSessions(sessions => {
        const dupeId = getDuplicateCountForUserId(lookupResult.user.id)

        const title = `${lookupResult.user.name}`

        sessions.unshift({
          dupeId,
          title,
          id: `session${++lastSessionKey.current}`,
          userId: lookupResult.user.id,
          data: lookupResult,
          state: {},
        })

        setTab(0)
        setNameLookup(null)
        // Save form values to query.
        updateLinkParams(({ userId, ...prev }) => ({
          ...prev,
          index,
          key,
        }))

        return sessions
      })

      // This function can be called outside of form submit,
      // if so update the form inputs.
      setValue('key', key)
      setValue('index', index)
    } catch (err) {
      setError('key', {
        type: 'manual',
        message:
          err instanceof Error && 'message' in err
            ? err.message
            : 'Unknown error',
      })
    } finally {
      setBusy(false)
    }
  }

  const pageTitle = React.useMemo(() => {
    let title = 'Users'

    if (sessions?.length > 0 && tab >= 0 && tab < sessions?.length) {
      title += ` [${sessions[tab].title}]`
    }

    return title
  }, [tab, sessions])

  const closeSession = React.useCallback(() => {
    // Filter out sessions with deleted user.
    updateSessions(prev => {
      const filtered = prev.filter(
        session => session.userId !== activeSession?.userId,
      )

      updateLinkParams((): Record<string, string> => {
        return filtered[0]?.userId ? { userId: filtered[0].userId } : {}
      })

      return filtered
    })
  }, [updateSessions, activeSession])

  const refreshSession = React.useCallback(() => {
    return onLookup({
      key,
      index,
    })
  }, [key, index, onLookup])

  const isArchivedUser = activeSession?.data.user?.isDeleted ?? false

  // default to overview json page if user is archived.
  React.useEffect(() => {
    if (isArchivedUser) {
      updateLinkParams(prev => ({
        ...prev,
        userDropdown: 'overview json',
      }))
    }
  }, [isArchivedUser])

  return (
    <div className={classes.root}>
      <Helmet title={pageTitle} />

      <Paper className={classes.header} elevation={0}>
        <form className={classes.lookupForm} onSubmit={handleSubmit(onLookup)}>
          <div className={classes.lookupInputs}>
            <FormControl
              variant="standard"
              className={classes.indexSelect}
              disabled={busy}
            >
              <InputLabel>By</InputLabel>
              <Controller
                control={control}
                name="index"
                as={
                  <Select
                    variant="standard"
                    defaultValue="nameLowercase"
                    onChange={event => setValue('index', event.target.value)}
                  >
                    {INDEX_TYPES.map(i => (
                      <MenuItem key={i.key} value={i.key}>
                        {i.name}
                      </MenuItem>
                    ))}
                  </Select>
                }
              />
            </FormControl>
            <TextField
              variant="standard"
              name="key"
              autoComplete="off"
              data-1p-ignore
              data-lpignore
              inputRef={register({ required: true })}
              error={!!errors.key}
              helperText={
                !!errors.key &&
                (errors.key.message || `${activeIndex.name} is required`)
              }
              disabled={busy}
              className={classes.keyTextField}
              label={activeIndex.name}
              placeholder={`Enter ${index[0] === 'a' ? 'an' : 'a'} ${
                activeIndex.name
              }`}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </div>
          <div className={classes.lookupButtons}>
            <Button
              style={{ alignSelf: 'center', marginRight: 8 }}
              type="submit"
              disabled={busy}
              disableElevation
              variant="contained"
              color="primary"
            >
              Lookup
            </Button>
            <Button
              onClick={() => setShowHistory(true)}
              disableElevation
              disabled={busy}
              style={{ flexShrink: 0, alignSelf: 'center', marginRight: 8 }}
            >
              History
            </Button>
          </div>
        </form>
      </Paper>

      <div className={classes.session}>
        {!!activeSession && !nameLookup && (
          <>
            <div className={classes.currentPlayerContainer}>
              {isArchivedUser ? (
                <>
                  <div className={classes.deletedUserContainer}>
                    {`Deleted User: ${activeSession.data.user.name}`}
                  </div>
                </>
              ) : (
                <>
                  <Typography variant="h4">
                    {`Current Player: ${activeSession.data.user.name}`}
                  </Typography>

                  <CopyToClipboard text={activeSession.data.user.name}>
                    <IconButton
                      onClick={() =>
                        toast.success('Copied Current Player to clipboard!')
                      }
                      size="small"
                      className={classes.copyPlayerButton}
                    >
                      <FileCopy />
                    </IconButton>
                  </CopyToClipboard>
                </>
              )}
            </div>

            <div className={classes.actionsContainer}>
              <div>
                <TextField
                  className={classes.viewSwitcher}
                  select
                  value={query.userDropdown}
                  variant="outlined"
                  size="small"
                  onChange={({ target }) =>
                    updateLinkParams(prev => ({
                      ...prev,
                      userDropdown: target.value,
                    }))
                  }
                >
                  {selectableViews.map(data => {
                    // don't show mobile views unless it's mobile OR the user is already on a mobile view on desktop
                    if (
                      data.mobileOnly &&
                      isDesktop &&
                      data.key !== query.userDropdown
                    ) {
                      return null
                    }

                    if (isArchivedUser && !data.isAvailable) {
                      return null
                    }

                    if (isArchivedUser && data.isAvailable) {
                      return (
                        <MenuItem key={data.key} value={data.key}>
                          {data.name}
                        </MenuItem>
                      )
                    }

                    return (
                      <MenuItem key={data.key} value={data.key}>
                        {data.name}
                      </MenuItem>
                    )
                  })}
                </TextField>
              </div>
              <UserActions
                updateUserData={updateActiveSessionData}
                userData={activeSession.data}
                closeSession={closeSession}
                refreshSession={refreshSession}
                isActiveSession={!!activeSession}
              />
            </div>
          </>
        )}

        {nameLookup && (
          <UserNameSearch users={nameLookup} onLookup={onLookup} />
        )}

        {!nameLookup &&
          (activeSession ? (
            <div className={classes.activeView}>
              {renderSelectedView(query.userDropdown)}
            </div>
          ) : (
            <Typography
              variant="h5"
              color="primary"
              className={classes.emptySession}
            >
              {'Nothing to Display... you can always '}
              <Link
                underline="always"
                onClick={() => setShowHistory(true)}
                className={classes.viewHistoryLink}
              >
                view the history
              </Link>
              .
            </Typography>
          ))}
      </div>

      <AdminLookupsDialog
        adminLookups={adminLookups}
        onLookup={lookup => {
          onLookup(lookup)
          setShowHistory(false)
        }}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  )
})
