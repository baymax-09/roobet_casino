import React from 'react'
import { useHistory } from 'react-router-dom'
import { useLazyQuery } from '@apollo/client'
import { Button } from '@project-atl/ui'
import { Shuffle } from '@project-atl/ui/assets'

import { useTranslate } from 'app/hooks'
import { useToasts } from 'common/hooks'
import { isMobile } from 'app/util'
import { type TPGamesData, TPGamesFeelingLuckyQuery } from 'app/gql'

export interface ImFeelingLuckyProps {
  onClick?: () => void
}

export const ImFeelingLucky: React.FC<ImFeelingLuckyProps> = ({
  onClick = undefined,
}) => {
  const translate = useTranslate()
  const history = useHistory()
  const { toast } = useToasts()

  const [queryRandomGame] = useLazyQuery<TPGamesData>(
    TPGamesFeelingLuckyQuery,
    {
      variables: {
        device: isMobile() ? 'mobile' : 'desktop',
      },
      fetchPolicy: 'network-only',
      onCompleted: ({ tpGames }) => {
        const game = tpGames[0]
        history.push(`/game/${game.identifier}`)
        if (onClick) {
          onClick()
        }
      },
      onError: () => {
        toast.error(translate('globalSearch.errorLoading'))
      },
    },
  )

  return (
    <Button
      sx={{ height: 24 }}
      color="tertiary"
      onClick={() => queryRandomGame()}
      size="small"
      startIcon={<Shuffle />}
      variant="contained"
      label={translate('globalSearch.feelingLucky')}
    />
  )
}

export default React.memo(ImFeelingLucky)
