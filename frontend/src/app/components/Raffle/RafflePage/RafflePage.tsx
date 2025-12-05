import React from 'react'
import { useHistory } from 'react-router-dom'

import { Loading } from 'mrooi'
import { useLazyRoute } from 'app/hooks'
import { useAxiosGet } from 'common/hooks'

import { RAFFLE_TEMPLATES, useSharedRaffleStyles } from '../templates'

interface RafflePageProps {
  slug: string
}

export const RafflePage: React.FC<RafflePageProps> = ({ slug }) => {
  const classes = useSharedRaffleStyles({})
  const { replace } = useHistory()
  const { done } = useLazyRoute()

  const [{ data }, refetchRaffle] = useAxiosGet<{ raffle: any }>(
    `raffle/${slug}`,
    {
      onCompleted: data => {
        if (data?.raffle) {
          done()
          return
        }
        replace('/')
      },
    },
  )

  const raffle = data?.raffle

  // If template is not implemented, redirect home.
  if (raffle && !(raffle.type in RAFFLE_TEMPLATES)) {
    replace('/')
    return null
  }

  const Page = raffle && RAFFLE_TEMPLATES[raffle.type].page

  return (
    <div className={classes.RafflePage__container}>
      <div className={classes.RafflePage}>
        {raffle && Page ? (
          <Page raffle={raffle} reload={refetchRaffle} />
        ) : (
          <Loading />
        )}
      </div>
    </div>
  )
}
