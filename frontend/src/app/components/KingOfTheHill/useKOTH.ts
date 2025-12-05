import React from 'react'
import { useSessionStorage } from 'react-use'

import { api } from 'common/util'
import { defaultSocket } from 'app/lib/sockets'
import { type KOTHFlavor, type KOTHState } from 'common/types'

interface CurrentKing {
  name: string
  hidden: boolean
  gameName: string
  gameMult: number
  gameImage?: string
  gameIdentifier?: string
  // there is other stuff on this
}

const KOTH_SESSION_KEY = 'roobet-koth-show-map'

export function useKOTH(whichRooKnown: KOTHFlavor | null = null) {
  const [earnings, setEarnings] = React.useState<number>(0)
  const [currentKing, setCurrentKing] = React.useState<CurrentKing | null>(null)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [startDate, setStartDate] = React.useState<Date | null>(null)
  const [endDate, setEndDate] = React.useState<Date | null>(null)
  const [timerText, setTimerText] = React.useState<Date | null>(null)
  const [whichRoo, setWhichRoo] = React.useState<KOTHFlavor | null>()
  const [minBet, setMinBet] = React.useState<number>(0)
  const [kothState, setkothState] = React.useState<KOTHState | null>(null)

  const [showKoth, setShowKoth] = useSessionStorage<{
    [key in KOTHFlavor]: boolean
  }>(KOTH_SESSION_KEY, {
    astro: false,
    king: false,
  })

  const refresh = async () => {
    setLoading(true)

    const response = await api.get<
      any,
      {
        currentKing?: CurrentKing | null
        config: {
          startTime: string
          endTime: string
          earnings?: number | null
          whichRoo?: KOTHFlavor
          minBet?: number | null
          showKoth?: boolean | null
        }
      }
    >('/koth/active')

    setStartDate(new Date(response.config.startTime))
    setEndDate(new Date(response.config.endTime))
    setEarnings(response.config.earnings || 0)
    setCurrentKing(response.currentKing || null)
    setWhichRoo(response.config.whichRoo || null)
    setLoading(false)
    setMinBet(response.config.minBet ?? 1)

    if (response.config.whichRoo) {
      // The typing here is incorrect, so we're just spreading the value from state.
      setShowKoth({
        ...showKoth,
        [response.config.whichRoo]: !!response.config.showKoth,
      })
    } else {
      // If KOTH has ended and we're no longer getting any indication from the request payload to keep showing, remove session key.
      window.sessionStorage.removeItem(KOTH_SESSION_KEY)
      setShowKoth({
        astro: false,
        king: false,
      })
    }
  }

  React.useEffect(() => {
    const onNewKing = newKing => {
      setCurrentKing(newKing)
    }

    const onUpdate = ({ config, currentLeaderEarnings }) => {
      setStartDate(new Date(config.startTime))
      setEndDate(new Date(config.endTime))

      if (currentLeaderEarnings) {
        setEarnings(config.earnings)
      }
    }

    refresh().then(() => {
      defaultSocket._socket.on('kothNewKing', onNewKing)
      defaultSocket._socket.on('kothUpdate', onUpdate)
    })

    return () => {
      defaultSocket._socket.off('kothNewKing', onNewKing)
      defaultSocket._socket.off('kothUpdate', onUpdate)
    }
  }, [])

  React.useEffect(() => {
    if (loading || !startDate || !endDate) {
      return
    }

    let previousState: KOTHState | null = null
    let timeout: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      const now = new Date()

      let newState: KOTHState | null = null

      if (now.getTime() < startDate.getTime()) {
        newState = 'starting'
        setTimerText(startDate)
      } else if (now.getTime() > endDate.getTime()) {
        newState = 'ended'
        setTimerText(endDate)
      } else {
        newState = 'active'
        setTimerText(endDate)
      }

      if (previousState !== null && newState !== previousState) {
        refresh()
      }

      setkothState(newState)
      previousState = newState
      timeout = setTimeout(tick, 1000)
    }

    tick()
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [loading, startDate, endDate])

  const determinedShowKoth = showKoth[whichRoo ?? whichRooKnown ?? 'king']

  return {
    loading,
    currentKing,
    earnings,
    timerText,
    whichRoo,
    showKoth: determinedShowKoth,
    minBet,
    kothState,
    refresh,
  }
}
