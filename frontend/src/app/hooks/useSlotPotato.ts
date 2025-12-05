import { useCallback, useEffect, useState } from 'react'
import moment from 'moment'
import { useQuery } from '@apollo/client'

import { defaultSocket } from 'app/lib/sockets'
import {
  SlotPotatoActiveQuery,
  type SlotPotato,
  type SlotPotatoGame,
  type SlotPotatoActiveQueryData,
} from 'app/gql/slotPotato'

const TIMEOUT = 1000

export const useSlotPotato = () => {
  const [isSlotPotatoActive, setSlotPotatoActive] = useState(false)
  const [shouldShowCountdownBanner, setShowCountdownBanner] = useState(false)
  const [activeGame, setActiveGame] = useState<SlotPotatoGame | undefined>()

  const getActiveGame = (slotPotatoArg: SlotPotato | null) => {
    return slotPotatoArg?.games.find(game => {
      return moment().isBetween(
        moment(game.startDateTime),
        moment(game.endDateTime),
      )
    })
  }

  const { refetch, called, loading, data } =
    useQuery<SlotPotatoActiveQueryData>(SlotPotatoActiveQuery, {
      onCompleted: data => {
        if (data?.slotPotatoActive) {
          setSlotPotatoActive(true)
          const defaultShowCountdownBanner = data.slotPotatoActive.startDateTime
            ? moment().isBefore(moment(data.slotPotatoActive.startDateTime))
            : false
          setShowCountdownBanner(defaultShowCountdownBanner)
          setActiveGame(getActiveGame(data.slotPotatoActive))
        }
      },
    })
  const slotPotato = data?.slotPotatoActive || null

  const handleSetActiveGame = useCallback(
    (cb?: any) => {
      const currentActiveGame = getActiveGame(slotPotato)
      setActiveGame(currentActiveGame)

      if (cb) {
        cb()
      }
    },
    [getActiveGame],
  )

  const checkActiveGame = (gameId: string): boolean => {
    if (activeGame?.game.id === gameId) {
      return true
    } else {
      return false
    }
  }

  const checkGameExists = (gameId: string): boolean => {
    if (!slotPotato) {
      return false
    }

    return slotPotato.games.some(game => game.game.id === gameId)
  }

  const checkGameIsComplete = (gameId: string): boolean => {
    if (!slotPotato) {
      return false
    }

    const game = slotPotato.games.find(({ game }) => gameId === game.id)

    if (game) {
      return moment(game.endDateTime).isBefore(moment())
    } else {
      return false
    }
  }

  const handleCompleteCountdown = () => {
    setShowCountdownBanner(false)

    // we don't need to get the current active game, we just need to start the first game
    const activeGame = slotPotato?.games[0]
    setActiveGame(activeGame)
  }

  // Timer that moves onto the next game and sets the active game
  // shuts down slot potato after final game finishes
  useEffect(() => {
    if (!activeGame) {
      return
    }

    const timeToLive = moment(activeGame?.endDateTime)
      .add(TIMEOUT, 'ms')
      .diff(moment())
    const numGames = slotPotato?.games.length || 0

    const timer = setTimeout(() => {
      if (activeGame && activeGame?.order > numGames) {
        setSlotPotatoActive(false)
      } else {
        handleSetActiveGame()
      }
    }, timeToLive)

    return () => clearTimeout(timer)
  }, [activeGame?.endDateTime, handleSetActiveGame])

  useEffect(() => {
    if (activeGame || !called || (called && loading) || !slotPotato) {
      return
    }

    setActiveGame(getActiveGame(slotPotato))
  }, [called, loading, slotPotato, getActiveGame, setActiveGame])

  // Refetch data when we receive a websocket event
  useEffect(() => {
    defaultSocket._socket.on('slotPotatoEventStart', payload => {
      refetch()
    })
    defaultSocket._socket.on('slotPotatoEventEnd', payload => {
      refetch()
    })
    defaultSocket._socket.on(
      'slotPotatoEventCancelled',
      ({ id }: { id: string }) => {
        refetch()
      },
    )

    return () => {
      defaultSocket._socket.off('slotPotatoEventStart')
      defaultSocket._socket.off('slotPotatoEventEnd')
      defaultSocket._socket.off('slotPotatoEventCancelled')
    }
  }, [])

  return {
    slotPotato,
    activeGame,
    shouldShowCountdownBanner,
    isSlotPotatoActive,

    checkActiveGame,
    checkGameExists,
    handleSetActiveGame,
    handleCompleteCountdown,
    checkGameIsComplete,
  }
}
