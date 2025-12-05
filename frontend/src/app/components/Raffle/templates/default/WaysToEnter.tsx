import React from 'react'
import { Typography, Link, theme as uiTheme } from '@project-atl/ui'
import { Link as RouterLink } from 'react-router-dom'
import { Trans } from 'react-i18next'

import { getCachedSrc } from 'common/util'
import { type RaffleModifierType, type RaffleModifier } from 'common/types'
import { GAME_PROVIDERS } from 'app/constants'
import ticketsImage from 'assets/images/raffle/default/tickets.png'
import { useTranslate } from 'app/hooks'

import { type PopulatedRaffle } from '../../types'

import { useWaysToEnterStyles } from './WaysToEnter.styles'

const BASE_ROUTES: Record<RaffleModifierType, string> = {
  gameIdentifier: 'game',
  gameGroup: 'tag',
  gameProvider: 'provider',
}

interface WaysToEnterProps {
  raffle: PopulatedRaffle
}

const getModifierLink = (modifier: RaffleModifier, slug: string): string => {
  if (modifier.type === 'gameIdentifier' && slug === 'crash') {
    return '/crash'
  }

  return `/${BASE_ROUTES[modifier.type]}/${slug}`
}

export const WaysToEnter: React.FC<WaysToEnterProps> = ({ raffle }) => {
  const classes = useWaysToEnterStyles()
  const translate = useTranslate()

  // We only care to show the first modifier for now. May refactor in the future to use more than just the first.
  const modifier = raffle.modifiers.length > 0 ? raffle.modifiers[0] : undefined
  // Use the feature image provided in the ACP.
  const modifierImage = raffle.featureImage

  return (
    <div className={classes.WaysToEnterBlocksContainer}>
      <div className={classes.WaysToEnterBlock}>
        <div className={classes.WaysToEnterBlock__textContainer}>
          <Typography
            variant="body2"
            color={uiTheme.palette.neutral[300]}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {translate('raffle.playNow')}
          </Typography>
          <Typography
            variant="h6"
            color={uiTheme.palette.common.white}
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            <Trans
              i18nKey="raffle.howToEnterRule1"
              values={{
                ticketsPerBenjamin: Math.floor(
                  raffle?.ticketsPerDollar * raffle.baseDollarAmount,
                ),
                dollarAmount: raffle.baseDollarAmount,
              }}
            />
          </Typography>
        </div>
        <img
          className={classes.WaysToEnterBlock__ticketsImage}
          src={getCachedSrc({ src: ticketsImage, quality: 85 })}
          alt="raffle-tickets"
        />
      </div>
      {modifier && (
        <div className={classes.WaysToEnterBlock}>
          <div className={classes.WaysToEnterBlock__textContainer}>
            <Typography
              variant="body2"
              color={uiTheme.palette.neutral[300]}
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {translate('raffle.playNow')}
            </Typography>
            <Typography
              variant="h6"
              color={uiTheme.palette.common.white}
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              <Trans
                i18nKey="raffle.mod"
                values={{
                  ticketsPerBenjamin: Math.floor(
                    modifier.ticketsPerDollar * raffle.baseDollarAmount,
                  ),
                  amount: raffle.baseDollarAmount,
                }}
              >
                <span>
                  {modifier.identifiers.map((identifier, index) => {
                    let slug = identifier.id
                    let title = identifier.title

                    if (modifier.type === 'gameProvider') {
                      const provider =
                        GAME_PROVIDERS[slug] ??
                        Object.values(GAME_PROVIDERS).find(gameProvider =>
                          // We may have some titles like "Blueprint Gaming" instead of just "blueprint"
                          title
                            .toLowerCase()
                            .includes(gameProvider.title.toLowerCase()),
                        )

                      if (!provider) {
                        return null
                      }

                      slug = provider.path
                      title = provider.title
                    }

                    return (
                      <React.Fragment key={slug}>
                        <Link
                          className={classes.Link}
                          component={RouterLink}
                          key={identifier.id}
                          to={getModifierLink(modifier, slug)}
                          color={uiTheme.palette.neutral[400]}
                        >
                          {title}
                        </Link>
                        {index !== modifier.identifiers.length - 1 && ', '}
                      </React.Fragment>
                    )
                  })}
                </span>
              </Trans>
            </Typography>
          </div>
          <img
            alt="raffle-modifier"
            className={classes.WaysToEnterBlock__ticketsImage}
            src={modifierImage}
          />
        </div>
      )}
    </div>
  )
}
