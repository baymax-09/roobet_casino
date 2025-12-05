import React from 'react'

import { Skeleton } from 'mrooi'

import { useGameThumbnailSkeletonStyles } from './GameThumbnailSkeleton.styles'

const GameThumbnailSkeleton: React.FC = () => {
  const classes = useGameThumbnailSkeletonStyles()

  return (
    <div className={classes.GameThumbnail}>
      <Skeleton
        className={classes.GameThumbnail__image}
        variant="rectangular"
        animation="wave"
      />
      <div className={classes.TextContainer}>
        <Skeleton
          className={classes.TextContainer__provider}
          animation="wave"
        />
      </div>
    </div>
  )
}

export default GameThumbnailSkeleton
