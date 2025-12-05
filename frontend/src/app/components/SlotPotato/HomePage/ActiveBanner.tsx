import React from 'react'
import { LinearProgress, Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { type SlotGame, type SlotPotatoGame } from 'app/gql/slotPotato'
import { useTranslate } from 'app/hooks'

import { ChipSlider } from '../Elements'
import { ActiveChip } from '../SlotPotatoChips'
import { GeneralBanner } from '../GeneralBanner'

import { useActiveBannerStyles } from './ActiveBanner.styles'

export interface ActiveBannerProps {
  games: SlotPotatoGame[]
  activeGameId: string
  gameDuration: number
}

interface ActiveChipProgressProps {
  game: SlotGame
  activeGameIndex: number
  totalGames: number
}

export const ActiveChipProgress: React.FC<ActiveChipProgressProps> = ({
  activeGameIndex,
  totalGames,
}) => {
  const classes = useActiveBannerStyles()
  const translate = useTranslate()

  const currentGameIndex = activeGameIndex + 1
  const value = (currentGameIndex / totalGames) * 100
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <div className={classes.ActiveChipProgress}>
      <div className={classes.ActiveChipProgressTextContainer}>
        <Typography
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightBold}
          {...(isTabletOrDesktop
            ? {
                fontSize: '1.125rem',
                lineHeight: '1.625rem',
              }
            : {
                variant: 'body4',
              })}
        >
          {translate('slotPotato.gameProgress')}
        </Typography>
        <Typography
          marginLeft="auto"
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightBold}
          {...(isTabletOrDesktop
            ? {
                fontSize: '1.125rem',
                lineHeight: '1.625rem',
              }
            : {
                variant: 'body4',
              })}
        >
          {currentGameIndex} {translate('slotPotato.of')} {totalGames}
        </Typography>
      </div>
      <LinearProgress color="secondary" value={value} />
    </div>
  )
}

export const ActiveBanner: React.FC<ActiveBannerProps> = ({
  games,
  activeGameId,
  gameDuration,
}) => {
  const classes = useActiveBannerStyles()

  const activeGame = games.find(game => game.game.id === activeGameId)
  const activeGameIndex = activeGame ? games.indexOf(activeGame) : undefined
  const totalGames = games.length

  return (
    <GeneralBanner
      showThreeTimesRewards={true}
      bannerClassName={classes.ActiveBanner}
      content={
        <div className={classes.ContentContainer}>
          {activeGame ? <ActiveChip game={activeGame.game} /> : null}
          <div className={classes.ActiveBannerRightContainer}>
            {activeGame && activeGameIndex !== undefined ? (
              <ActiveChipProgress
                game={activeGame.game}
                activeGameIndex={activeGameIndex}
                totalGames={totalGames}
              />
            ) : null}
            <ChipSlider
              games={games}
              activeGameId={activeGameId}
              gameDuration={gameDuration}
            />
          </div>
        </div>
      }
    />
  )
}
