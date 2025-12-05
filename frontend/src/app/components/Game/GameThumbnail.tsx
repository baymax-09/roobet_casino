import React, { type PropsWithChildren } from 'react'
import clsx from 'clsx'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Typography } from '@project-atl/ui'
import { useLazyQuery } from '@apollo/client'
import { LazyLoadImage } from 'react-lazy-load-image-component'

import thumbnail_1 from 'assets/images/game/default/thumbnail_1.jpg'
import thumbnail_2 from 'assets/images/game/default/thumbnail_2.jpg'
import { getCachedSrc } from 'common/util'
import { type TPGameData, TPGameQuery } from 'app/gql'
import { isMobile } from 'app/util'

import { GameLink } from './GameLink'

import { useGameThumbnailStyles } from './GameThumbnail.styles'

const FALLBACK_IMAGES = [thumbnail_1, thumbnail_2]

const getFallbackImageSrc = id => {
  if (typeof id === 'string') {
    // Simple hash to create repeatable index.
    const hash = id.split('').reduce(function (a, b) {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return FALLBACK_IMAGES[Math.abs(hash) % FALLBACK_IMAGES.length]
  }

  return undefined
}

interface GameThumbnailProps {
  game: any
  inline?: boolean
  searchResult?: boolean
  searchSelected?: boolean
  outsideRef?: any
  scrollPosition?: any
  gameThumbnailClassName?: string
  gameThumbnailImageClassName?: string
  onGameThumbnailClick?: () => void
}

/**
 * A wrapper component that prefetches game data when hovered over.
 *
 * Disabled for now, will reintroduce when our GQL workload can handle the # of reqs.
 *
 * @component
 * @param {React.PropsWithChildren<{ gameIdentifier: string }>} props - The component props.
 * @param {string} props.gameIdentifier - The identifier of the game.
 * @returns {JSX.Element} The rendered ThumbnailPrefetchWrapper component.
 */
const ThumbnailPrefetchWrapper: React.FC<
  React.PropsWithChildren<{ gameIdentifier: string }>
> = ({ children, gameIdentifier }) => {
  const [hoverTimeout, setHoverTimeout] = React.useState<NodeJS.Timeout | null>(
    null,
  )
  const [prefetch] = useLazyQuery<TPGameData>(TPGameQuery, {
    variables: {
      type: isMobile() ? 'mobile' : 'desktop',
      gameIdentifier,
    },
  })

  /**
   * Handles the mouse enter event for the game thumbnail.
   * Creates a timeout function that will prefetch the game data.
   * If the user leaves the thumbnail before the timeout is reached, the timeout is cleared.
   */
  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      prefetch({ variables: { gameIdentifier } }).catch(() => {
        // Suppressing the error because we don't care about it
      })
    }, 225)
    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
  }

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </div>
  )
}

/**
 * A simple composable game thumbnail image view. Should not contain any business logic.
 */
export const GameThumbnailImage: React.FC<
  PropsWithChildren<GameThumbnailProps>
> = props => {
  const { game, searchResult, scrollPosition } = props

  const classes = useGameThumbnailStyles()

  /**
   * This is here because we can't trust the URLs sent to us from game providers.
   * We are catching the errors if they happen then running some logic to load local assets
   * We load a default image but tie that image to the game's id to make sure it loads the same default image
   */
  const onImageError = event => {
    // Use fallback image on load error.
    if (event.target) {
      const isFallback = FALLBACK_IMAGES.find(path =>
        event.target.src.includes(path),
      )
      // Negate infinite loops when the fallbacks also fail to load.
      if (!isFallback) {
        const src = getFallbackImageSrc(game.identifier)

        if (src) {
          event.target.src = src
          event.target.style.objectFit = 'cover'
        }
      }
    }
  }

  const getBlurrySrc = () => {
    if (searchResult) {
      return getCachedSrc({
        src: game.squareImage ?? getFallbackImageSrc(game.identifier),
        width: 170,
        height: 170,
        quality: 10,
        blur: 150,
      })
    }

    return getCachedSrc({
      src: game.squareImage ?? getFallbackImageSrc(game.identifier),
      quality: 30,
      blur: 150,
    })
  }

  const getFullResolutionSrc = () => {
    if (searchResult) {
      return getCachedSrc({
        src: game.squareImage ?? getFallbackImageSrc(game.identifier),
        width: 170,
        height: 170,
        quality: 80,
      })
    }

    return getCachedSrc({
      src: game.squareImage ?? getFallbackImageSrc(game.identifier),
      quality: 80,
      blur: 0,
    })
  }

  return (
    <LazyLoadImage
      onError={onImageError}
      src={getFullResolutionSrc()}
      alt={game.title}
      placeholderSrc={getBlurrySrc()}
      width="100%"
      height="100%"
      threshold={0}
      scrollPosition={scrollPosition}
      className={classes.GameThumbnail__lazyImage}
    />
  )
}

const GameThumbnail: React.FC<
  PropsWithChildren<GameThumbnailProps>
> = props => {
  const {
    game,
    inline,
    searchResult,
    outsideRef,
    gameThumbnailClassName,
    gameThumbnailImageClassName,
    children,
    onGameThumbnailClick,
  } = props

  const classes = useGameThumbnailStyles()

  return (
    <div
      className={clsx(
        classes.GameThumbnail,
        {
          [classes.GameThumbnail_inline]: inline,
        },
        gameThumbnailClassName,
      )}
    >
      {/* <ThumbnailPrefetchWrapper gameIdentifier={game.identifier}> */}
      <GameLink
        ref={outsideRef}
        game={game}
        className={clsx({
          [classes.GameThumbnail_searchLink]: searchResult,
        })}
        {...(onGameThumbnailClick && { onClick: onGameThumbnailClick })}
      >
        <div
          className={clsx(
            classes.GameThumbnail__image,
            {
              [classes.GameThumbnail__image_searchImage]: searchResult,
            },
            gameThumbnailImageClassName,
          )}
        >
          <GameThumbnailImage {...props} />
          <div className={classes.GameThumbnail__play}>
            <div className={classes.GameThumbnail__playButton}>
              <FontAwesomeIcon fixedWidth icon={['fas', 'play']} />
            </div>
          </div>
        </div>
      </GameLink>
      {/* </ThumbnailPrefetchWrapper> */}
      <div className={classes.GameDetails}>
        <Typography variant="body4" className={classes.GameDetails__provider}>
          {game.provider}
        </Typography>
      </div>
      {children}
    </div>
  )
}

export default React.memo(GameThumbnail)
