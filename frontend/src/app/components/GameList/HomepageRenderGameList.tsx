import React from 'react'

/*
 * TODO: Remove all route imports in components
 * These imports break unit tests where we import anything from 'app/components'
 * which means we fully evaluate these route components for simple component unit tests
 * maybe this code belongs in routes?
 */
import { applyGameTagOverrides } from 'app/constants'
import { type GameTag } from 'common/types'
import { useLocale } from 'app/hooks'

import ApolloCacheGameList from './ApolloCacheGameList'

interface HomepageRenderGameListProps {
  tag: GameTag
}

const HomepageRenderGameList: React.FC<HomepageRenderGameListProps> = ({
  tag,
}) => {
  const lang = useLocale()

  const configWithOverrides = applyGameTagOverrides(tag, lang)

  return (
    <ApolloCacheGameList
      key={tag.slug}
      title={configWithOverrides.title}
      tags={tag.slug}
      path={tag.slug}
      pageSize={tag.pageSize ?? 18}
      preview={true}
      showCollate={false}
      gamesFilter={{ tagSlugs: [tag.slug] }}
    />
  )
}

export default HomepageRenderGameList
