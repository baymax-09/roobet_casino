import React from 'react'

import { Skeleton } from 'mrooi'

import { useLeaderboardStyles } from './Leaderboard.styles'

const LeaderboardLoadingSkeletons: React.FC = () => {
  const classes = useLeaderboardStyles()

  return (
    <div className={classes.LeaderBoard__loadingSkeletons}>
      {[...Array(3)].map((_, i) => (
        <Skeleton
          className={classes.LoadingSkeletons__skeleton}
          key={i}
          variant="rectangular"
          animation="wave"
        />
      ))}
    </div>
  )
}

export default LeaderboardLoadingSkeletons
