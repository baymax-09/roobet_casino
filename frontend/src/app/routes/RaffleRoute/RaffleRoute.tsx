import React from 'react'

import { RafflePage } from 'app/components/Raffle'

export const RaffleRoute = props => {
  const slug = props.match.params.slug

  return <RafflePage slug={slug} />
}
