import React, { type PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

const HOUSE_GAME_LEGACY_NAMES: ReadonlyMap<string, string> = new Map([
  ['roulette', 'housegames:roulette'],
  ['towers', 'housegames:towers'],
  ['dice', 'housegames:dice'],
  ['crash', 'housegames:crash'],
  ['mines', 'housegames:mines'],
])

const HOUSE_GAMES_REDIRECTS: ReadonlyMap<string, string> = new Map([
  ['housegames:Plinko', '/plinko'],
  ['housegames:hotbox', '/snoops-hotbox'],
  ['housegames:dice', '/dice'],
  ['housegames:towers', '/towers'],
  ['housegames:roulette', '/roulette'],
  ['housegames:crash', '/crash'],
  ['housegames:mines', '/mines'],
  ['housegames:junglemines', '/junglemines'],
  ['housegames:linearmines', '/mission-uncrossable'],
  ['housegames:coinflip', '/coinflip'],
])

interface GameLinkProps {
  game: any
  ref?: any
  className?: string
}

export const GameLink: React.FC<
  PropsWithChildren<GameLinkProps & { ref?: any }>
> = ({ game, children, ...linkProps }) => {
  const link = React.useMemo(() => {
    if (game.overrideLink) {
      return game.overrideLink
    }

    // Normalize references to legacy house game identifiers.
    const identifier =
      HOUSE_GAME_LEGACY_NAMES.get(game.identifier) ?? game.identifier

    // Look up redirect for house games, if applicable.
    const houseGameOverridePath = HOUSE_GAMES_REDIRECTS.get(identifier)

    if (houseGameOverridePath) {
      return houseGameOverridePath
    }

    return `/game/${identifier}`
  }, [game])

  return (
    <Link to={link} {...linkProps}>
      {children}
    </Link>
  )
}
