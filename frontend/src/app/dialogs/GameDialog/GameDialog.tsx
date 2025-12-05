import React from 'react'
import moment from 'moment'
import { Typography, Box } from '@mui/material'
import { Helmet } from 'react-helmet'

import { DialogTitle, Dialog } from 'mrooi'
import { useAxiosGet } from 'common/hooks'
import { useTranslate, useDialogsLinkUpdate } from 'app/hooks'
import { rouletteChoiceToColor } from 'app/util'

import { useGameDialogStyles } from './GameDialog.styles'

interface Game {
  gameName: string
  id: string
  createdAt: string
  winningNumber: number
  crashPoint: number
  hash: string
}

/**
 * This is a legacy Modal. This supports Crash + Roulette game types.
 */
export const GameDialog = ({ params: data, DialogProps }) => {
  const classes = useGameDialogStyles()
  const translate = useTranslate()
  useDialogsLinkUpdate()

  const [{ data: response }] = useAxiosGet<
    { game: Game; bets: unknown[] },
    { id: string }
  >(`${data.gameName}/getGameById`, {
    params: {
      id: data.id,
    },
  })
  const game = response?.game
  const bets = response?.bets

  return (
    <Dialog maxWidth="sm" fullWidth {...DialogProps}>
      <DialogTitle onClose={DialogProps.onClose}>
        {translate('gameModal.gameExplorer')}
      </DialogTitle>
      <Helmet title={`${translate('gameModal.gameExplorer')}`} />

      {game && bets && (
        <Box className={classes.GameModal} sx={{ color: 'white' }}>
          <Typography
            variant="h3"
            classes={{ h3: classes.GameModal__gameTitle }}
          >
            {game.gameName} {translate('gameModal.game')}
          </Typography>
          <Typography
            variant="body2"
            classes={{ body2: classes.GameModal__gameID }}
          >
            {translate('gameModal.id')}: {game.id}
          </Typography>

          <div className={classes.GameModal__stats}>
            <Typography variant="body2">
              <Box component="span" fontWeight="fontWeightBold">
                {translate('gameModal.startedAt')}:{' '}
              </Box>
              {moment(game.createdAt).format('llll')}
            </Typography>
            <Typography variant="body2">
              <Box component="span" fontWeight="fontWeightBold">
                # {translate('gameModal.ofBets')}:{' '}
              </Box>
              {bets.length}
            </Typography>
            <Typography variant="body2">
              <Box component="span" fontWeight="fontWeightBold">
                {translate('gameModal.hash')}:{' '}
              </Box>
              {game.hash}
            </Typography>

            {/* Roulette Specific */}
            {game.gameName === 'roulette' && (
              <div>
                <Typography variant="body2">
                  <Box component="span" fontWeight="fontWeightBold">
                    {translate('gameModal.winningColor')}:{' '}
                  </Box>
                  {rouletteChoiceToColor(game.winningNumber)}
                </Typography>
              </div>
            )}

            {/* Crash Specific */}
            {game.gameName === 'crash' && (
              <div>
                <Typography variant="body2">
                  <Box component="span" fontWeight="fontWeightBold">
                    {translate('gameModal.crashPoint')}:{' '}
                  </Box>
                  {`${game.crashPoint}x`}
                </Typography>
              </div>
            )}
          </div>
        </Box>
      )}
    </Dialog>
  )
}
