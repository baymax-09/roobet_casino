import React from 'react'
import clsx from 'clsx'
import { useImmer } from 'use-immer'
import { Skeleton, useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { DialogToggle } from 'mrooi'
import { api } from 'common/util'

import { useCrashHistoryStyles } from './CrashHistory.styles'

export const CrashHistory = React.memo(({ socketRef, readyRef }) => {
  const isDesktop = useMediaQuery(theme => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })
  const maxItems = React.useMemo(() => {
    return isDesktop ? 40 : 15
  }, [isDesktop])

  const [loading, setLoading] = React.useState(true)
  const [history, updateHistory] = useImmer([])
  const classes = useCrashHistoryStyles()

  React.useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      const recentNumbers = await api.get('/crash/recentNumbers')
      updateHistory(() => recentNumbers.slice(0, maxItems))
      setLoading(false)
    }

    const onReconnect = () => {
      loadHistory()
    }

    const onDisconnect = () => {
      setLoading(true)
    }

    socketRef.current.on('reconnect', onReconnect)
    socketRef.current.on('disconnect', onDisconnect)

    loadHistory()

    return () => {
      socketRef.current.off('reconnect', onReconnect)
      socketRef.current.off('disconnect', onDisconnect)
    }
  }, [])

  React.useEffect(() => {
    if (loading) {
      return
    }

    const socket = socketRef.current

    const onUpdate = update => {
      if (update.state === 'Over') {
        updateHistory(draftState => {
          draftState.unshift({
            _animated: true,
            crashPoint: update.crashPoint,
            id: update.id,
          })

          if (draftState.length > maxItems) {
            draftState.splice(maxItems)
          }
        })
      }
    }

    socket.on('crashGameUpdate', onUpdate)

    return () => {
      socket.off('crashGameUpdate', onUpdate)
    }
  }, [loading])

  return (
    <div className={classes.root}>
      {!loading
        ? history.map(hist => (
            <div
              key={hist.id}
              className={clsx(classes.game, {
                [classes.animated]: hist._animated,
              })}
            >
              <DialogToggle
                className={clsx(classes.button, {
                  [classes.green]: hist.crashPoint >= 2,
                  [classes.red]: hist.crashPoint < 2,
                })}
                dialog="game"
                params={{
                  params: {
                    id: hist.id,
                    gameName: 'crash',
                  },
                }}
                disableRipple
              >
                {/* eslint-disable-next-line i18next/no-literal-string */}
                {hist.crashPoint.toFixed(2)}x
              </DialogToggle>
            </div>
          ))
        : Array.from(
            {
              length: 20,
            },
            (_, i) => (
              <Skeleton
                key={i}
                className={classes.loader}
                variant="rectangular"
                width={55}
                height={28}
              />
            ),
          )}
    </div>
  )
})
