import dayLevel0 from 'assets/images/rewards/d/level_0.png'
import dayLevel1 from 'assets/images/rewards/d/level_1.png'
import dayLevel2 from 'assets/images/rewards/d/level_2.png'
import dayLevel3 from 'assets/images/rewards/d/level_3.png'
import dayLevel4 from 'assets/images/rewards/d/level_4.png'
import dayLevel5 from 'assets/images/rewards/d/level_5.png'
import dayLevel6 from 'assets/images/rewards/d/level_6.png'
import dayLevel7 from 'assets/images/rewards/d/level_7.png'
import dayLevel8 from 'assets/images/rewards/d/level_8.png'
import dayLevel9 from 'assets/images/rewards/d/level_9.png'
import dayLevel10 from 'assets/images/rewards/d/level_10.png'
import weekLevel0 from 'assets/images/rewards/w/level_0.png'
import weekLevel1 from 'assets/images/rewards/w/level_1.png'
import weekLevel2 from 'assets/images/rewards/w/level_2.png'
import weekLevel3 from 'assets/images/rewards/w/level_3.png'
import weekLevel4 from 'assets/images/rewards/w/level_4.png'
import weekLevel5 from 'assets/images/rewards/w/level_5.png'
import weekLevel6 from 'assets/images/rewards/w/level_6.png'
import weekLevel7 from 'assets/images/rewards/w/level_7.png'
import weekLevel8 from 'assets/images/rewards/w/level_8.png'
import weekLevel9 from 'assets/images/rewards/w/level_9.png'
import weekLevel10 from 'assets/images/rewards/w/level_10.png'
import monthLevel0 from 'assets/images/rewards/m/level_0.png'
import monthLevel1 from 'assets/images/rewards/m/level_1.png'
import monthLevel2 from 'assets/images/rewards/m/level_2.png'
import monthLevel3 from 'assets/images/rewards/m/level_3.png'
import monthLevel4 from 'assets/images/rewards/m/level_4.png'
import monthLevel5 from 'assets/images/rewards/m/level_5.png'
import monthLevel6 from 'assets/images/rewards/m/level_6.png'
import monthLevel7 from 'assets/images/rewards/m/level_7.png'
import monthLevel8 from 'assets/images/rewards/m/level_8.png'
import monthLevel9 from 'assets/images/rewards/m/level_9.png'
import monthLevel10 from 'assets/images/rewards/m/level_10.png'
import { type Level, type RoowardTimespan } from 'app/types/roowards'
import { getCachedSrc } from 'common/util'

interface RoowardsIconParams {
  type: RoowardTimespan
  level: Level
}

const dayRewards = {
  0: dayLevel0,
  1: dayLevel1,
  2: dayLevel2,
  3: dayLevel3,
  4: dayLevel4,
  5: dayLevel5,
  6: dayLevel6,
  7: dayLevel7,
  8: dayLevel8,
  9: dayLevel9,
  10: dayLevel10,
}

const weekRewards = {
  0: weekLevel0,
  1: weekLevel1,
  2: weekLevel2,
  3: weekLevel3,
  4: weekLevel4,
  5: weekLevel5,
  6: weekLevel6,
  7: weekLevel7,
  8: weekLevel8,
  9: weekLevel9,
  10: weekLevel10,
}

const monthRewards = {
  0: monthLevel0,
  1: monthLevel1,
  2: monthLevel2,
  3: monthLevel3,
  4: monthLevel4,
  5: monthLevel5,
  6: monthLevel6,
  7: monthLevel7,
  8: monthLevel8,
  9: monthLevel9,
  10: monthLevel10,
}

export const getRoowardsIcon = ({ type, level }: RoowardsIconParams) => {
  if (type === 'd') {
    return getCachedSrc({ src: dayRewards[level] })
  }
  if (type === 'w') {
    return getCachedSrc({ src: weekRewards[level] })
  }
  if (type === 'm') {
    return getCachedSrc({ src: monthRewards[level] })
  }
}
