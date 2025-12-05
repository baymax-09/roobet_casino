import React from 'react'
import sha1 from 'sha1'
import { useLocalStorage } from 'react-use'
import { useSelector } from 'react-redux'

import { useAxiosGet } from 'common/hooks'

import { RAFFLE_TEMPLATES, useSharedRaffleStyles } from '../templates'
import { type PopulatedRaffle } from '../types'

// Keep track of latest args to prevent unnecessary re-fetches.
let latestRaffleArgs: string | null = null

export const RaffleBanners = () => {
  const classes = useSharedRaffleStyles({})

  const { userId, userLoaded } = useSelector(({ user, settings }) => ({
    userId: user?.id,
    userLoaded: settings.loaded,
  }))

  // Store raffles in local storage to prevent content from "flashing".
  const [raffles, setRaffles] = useLocalStorage<PopulatedRaffle[]>(
    'activeRaffles',
    [],
  )

  const [, fetchRaffles] = useAxiosGet<{ raffles: PopulatedRaffle[] }>(
    'raffle',
    {
      lazy: true,
      onCompleted: data => {
        if (data?.raffles) {
          setRaffles(data.raffles)
        }
      },
    },
  )

  // Calculate hash of args to prevent redundant xhr calls.
  const raffleArgs: string = React.useMemo(() => {
    const stringifiedArgs = JSON.stringify({
      userId,
    })

    return sha1(stringifiedArgs)
  }, [userId])

  // Reload raffle when args change.
  React.useEffect(() => {
    if (!userLoaded) {
      return
    }

    if (raffleArgs !== latestRaffleArgs) {
      // Fetch latest raffles.
      fetchRaffles()

      // Store latest args in session storage.
      latestRaffleArgs = raffleArgs
    }
  }, [fetchRaffles, userLoaded, raffleArgs])

  return (
    <>
      {raffles.map(raffle => {
        if (raffle.type in RAFFLE_TEMPLATES) {
          const Banner = RAFFLE_TEMPLATES[raffle.type].banner

          if (!Banner) {
            return null
          }

          return (
            <div key={raffle._id} className={classes.RaffleBanner__container}>
              <Banner
                raffle={raffle}
                reload={async () => await fetchRaffles()}
              />
            </div>
          )
        }

        return null
      })}
    </>
  )
}
