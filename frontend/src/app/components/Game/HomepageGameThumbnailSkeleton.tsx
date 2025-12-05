import React from 'react'

import { Skeleton, useDefaultSliderBreakpoints } from 'mrooi'

import { useHomepageGameThumbnailSkeletonStyles } from './HomepageGameThumbnailSkeleton.styles'

const HomepageGameThumbnailSkeleton: React.FC = () => {
  const breakpoints = useDefaultSliderBreakpoints()
  const classes = useHomepageGameThumbnailSkeletonStyles({ breakpoints })

  return (
    <div className={classes.GameThumbnail}>
      <div className={classes.scaledThumbnail}>
        <Skeleton
          className={classes.GameThumbnail__image}
          variant="rectangular"
          animation="wave"
        />
      </div>
      <div className={classes.TextContainer}>
        <Skeleton
          className={classes.TextContainer__provider}
          animation="wave"
        />
      </div>
    </div>
  )
}

export default HomepageGameThumbnailSkeleton
