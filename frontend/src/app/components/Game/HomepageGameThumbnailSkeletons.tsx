import React from 'react'

import HomepageGameThumbnailSkeleton from './HomepageGameThumbnailSkeleton'

interface HomePageGameThumbnailSkeletonsProps {
  games: number
}

const HomePageGameThumbnailSkeletons: React.FC<
  HomePageGameThumbnailSkeletonsProps
> = ({ games }) => {
  return (
    <>
      {[...Array(games)].map((_, index) => (
        <HomepageGameThumbnailSkeleton key={index} />
      ))}
    </>
  )
}

export default React.memo(HomePageGameThumbnailSkeletons)
