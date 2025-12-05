const RankLevels = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30,
] as const
export type RankLevel = (typeof RankLevels)[number]

export interface LevelInfo {
  unlockedTime: Date
  claimedTime?: Date
  rankUpBonusAmount?: number // The amount users will receive when they claim their rank bonus.
}

export interface Rank {
  userId: string
  totalWageredAmount: number
  expectedRakebackOnRankUp: number
  levelInfo: Record<RankLevel, LevelInfo>
}
