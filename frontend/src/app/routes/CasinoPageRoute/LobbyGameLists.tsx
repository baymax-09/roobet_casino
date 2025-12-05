import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { type GameTag } from 'common/types'
import { applyGameTagOverrides } from 'app/constants'
import { GameListTagSkeleton, HomepageRenderGameList } from 'app/components'
import { useLocale } from 'app/hooks'

import { ProvidersList } from './ProvidersList'

interface LobbyGameListsProps {
  tags: GameTag[]
  loading: boolean
}

const PROVIDER_LIST = 'providers'

export const useLobbyGameListsStyles = makeStyles(() =>
  createStyles({
    ProviderList: {
      paddingBottom: uiTheme.spacing(3),
    },
  }),
)

export const LobbyGameLists: React.FC<LobbyGameListsProps> = ({
  tags,
  loading,
}) => {
  const classes = useLobbyGameListsStyles()
  const lang = useLocale()

  // We want to display the Provider List as the 4th game list
  const tagsWithProviders: Array<GameTag | typeof PROVIDER_LIST> = [...tags]
  tagsWithProviders.splice(3, 0, PROVIDER_LIST)

  return (
    <div>
      {loading ? (
        <GameListTagSkeleton tags={4} />
      ) : (
        <>
          {tagsWithProviders.map(tag => {
            if (typeof tag === 'string' && tag === PROVIDER_LIST) {
              return (
                <ProvidersList key={tag} className={classes.ProviderList} />
              )
            }

            const configWithOverrides = applyGameTagOverrides(tag, lang)
            return <HomepageRenderGameList tag={tag} />
          })}
        </>
      )}
    </div>
  )
}
