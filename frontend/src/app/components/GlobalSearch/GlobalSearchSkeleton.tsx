import React from 'react'

import { GameThumbnailSkeleton } from '../Game'

const NUMBER_OF_GAME_THUMBNAILS = 25

export const GlobalSearchSkeleton = () => {
  return (
    <>
      {[...Array(NUMBER_OF_GAME_THUMBNAILS)].map((_, index) => (
        <GameThumbnailSkeleton key={index} />
      ))}
    </>
  )
}
