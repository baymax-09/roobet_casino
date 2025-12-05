import React from 'react'
import { Link } from 'react-router-dom'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'
import { useMediaQuery } from '@mui/material'

import { useTranslate, useLocale } from 'app/hooks'
import {
  GAME_PROVIDERS,
  NUM_BETS,
  NUM_GAMES,
  getGameTagTitle,
} from 'app/constants'
import { type NormalizedTPGame } from 'common/types'

import { useGameDescStyles } from './GameDesc.styles'

interface GameDescProps {
  game: NormalizedTPGame | null
}

const GameDesc: React.FC<GameDescProps> = ({ game }) => {
  const classes = useGameDescStyles()
  const translate = useTranslate()
  const lang = useLocale()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'))

  if (!game) {
    return null
  }

  // Only show game tags with excludeFromTags set to "false".
  const gameTags = game.tags.filter(tag => !tag.excludeFromTags)

  return (
    <div className={classes.GameDescContainer}>
      <div className={classes.GameDesc}>
        <div className={classes.GameDesc__text}>
          <Typography
            color={uiTheme.palette.common.white}
            fontWeight={uiTheme.typography.fontWeightBold}
            textTransform="capitalize"
            {...(isTabletOrDesktop
              ? { variant: 'h5' }
              : { fontSize: '1.5rem', lineHeight: '2rem' })}
          >
            {game.title}
          </Typography>
          <Typography
            color={uiTheme.palette.neutral[300]}
            fontWeight={uiTheme.typography.fontWeightMedium}
            textTransform="capitalize"
            variant={isTabletOrDesktop ? 'h6' : 'body2'}
          >
            {game.provider}
          </Typography>
        </div>

        <div className={classes.GameDesc__tags}>
          {gameTags?.map(tag => {
            // Translating backend names but don't want tests to fail
            // t('gameList.bingo')
            // t('gameList.top-picks')
            return (
              <Link
                key={tag.slug}
                to={`/tag/${tag.slug}`}
                className={clsx(
                  classes.GameDesc__tags_tag,
                  classes.GameDesc__tags_tag_tag,
                )}
              >
                <Typography
                  variant="body2"
                  color={uiTheme.palette.common.white}
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {' '}
                  {`# ${getGameTagTitle(tag.slug, lang, tag.title)}`}
                </Typography>
              </Link>
            )
          })}
          {GAME_PROVIDERS[game.provider.toLowerCase()] && (
            <Link
              to={`/provider/${
                GAME_PROVIDERS[game.provider.toLowerCase()].path
              }`}
              className={clsx(
                classes.GameDesc__tags_tag,
                classes.GameDesc__tags_tag_provider,
              )}
            >
              <Typography
                variant="body2"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
              >{`# ${game.provider}`}</Typography>
            </Link>
          )}
        </div>
      </div>
      <Typography
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightMedium}
        variant={isTabletOrDesktop ? 'body2' : 'body4'}
      >
        {translate('gameRoute.gameDesc', {
          title: game.title,
          provider: game.provider,
          numBets: NUM_BETS,
          numGames: NUM_GAMES,
        })}
      </Typography>
    </div>
  )
}

export default React.memo(GameDesc)
