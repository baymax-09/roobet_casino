import React from 'react'

import { Skeleton } from 'mrooi'

import { HomePageGameThumbnailSkeletons } from '..'

import { useGameListTagSkeletonStyles } from './GameListTagSkeleton.styles'

interface GameListSkeltonProps {
  tags: number
}

export const GameListTagSkeleton: React.FC<GameListSkeltonProps> = ({
  tags,
}) => {
  const classes = useGameListTagSkeletonStyles()

  return (
    <>
      {[...Array(tags)].map((_, index) => (
        <div className={classes.GameListSkeleton} key={index}>
          <div className={classes.GameListSkeleton__header}>
            <div style={{ width: '20%' }}>
              <Skeleton height={35} animation="wave" />
            </div>
            <div style={{ width: '10%' }}>
              <Skeleton height={35} animation="wave" />
            </div>
          </div>
          <div className={classes.GameListSkeleton__wrapper}>
            <HomePageGameThumbnailSkeletons games={7} />
          </div>
        </div>
      ))}
    </>
  )
}

export default GameListTagSkeleton
