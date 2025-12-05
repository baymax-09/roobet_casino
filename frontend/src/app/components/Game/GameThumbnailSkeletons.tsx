import React from 'react'

import GameThumbnailSkeleton from './GameThumbnailSkeleton'

interface GameThumbnailSkeletonsProps {
  pageSize: number
}

const GameThumbnailSkeletons: React.FC<GameThumbnailSkeletonsProps> = ({
  pageSize,
}) => {
  return (
    <>
      {[...Array(pageSize)].map((_, index) => (
        <GameThumbnailSkeleton key={index} />
      ))}
    </>
  )
}

export default React.memo(GameThumbnailSkeletons)
