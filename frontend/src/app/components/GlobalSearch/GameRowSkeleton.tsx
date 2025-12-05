import React from 'react'

import { Skeleton } from 'mrooi'

import { useGameRowSkeletonStyles } from './'

export const GameRowSkeleton = () => {
  const classes = useGameRowSkeletonStyles()
  return (
    <div className={classes.GameSkeleton}>
      <div className={classes.GameSkeleton__iconContainer}>
        <Skeleton className={classes.GameSkeleton__icon} animation="wave" />
      </div>
      <div className={classes.GameSkeleton__textContainer}>
        <Skeleton className={classes.GameSkeleton__text} animation="wave" />
        <Skeleton className={classes.GameSkeleton__text} animation="wave" />
      </div>
    </div>
  )
}
