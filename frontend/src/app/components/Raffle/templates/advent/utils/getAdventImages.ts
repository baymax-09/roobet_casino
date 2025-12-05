import boxOpen1 from 'assets/images/raffle/advent/2023-12-frosty/opened/day1.png'
import boxOpen2 from 'assets/images/raffle/advent/2023-12-frosty/opened/day2.png'
import boxOpen3 from 'assets/images/raffle/advent/2023-12-frosty/opened/day3.png'
import boxOpen4 from 'assets/images/raffle/advent/2023-12-frosty/opened/day4.png'
import boxOpen5 from 'assets/images/raffle/advent/2023-12-frosty/opened/day5.png'
import boxOpen6 from 'assets/images/raffle/advent/2023-12-frosty/opened/day6.png'
import boxOpen7 from 'assets/images/raffle/advent/2023-12-frosty/opened/day7.png'
import boxOpen8 from 'assets/images/raffle/advent/2023-12-frosty/opened/day8.png'
import boxOpen9 from 'assets/images/raffle/advent/2023-12-frosty/opened/day9.png'
import boxOpen10 from 'assets/images/raffle/advent/2023-12-frosty/opened/day10.png'
import boxOpen11 from 'assets/images/raffle/advent/2023-12-frosty/opened/day11.png'
import boxOpen12 from 'assets/images/raffle/advent/2023-12-frosty/opened/day12.png'
import boxOpen13 from 'assets/images/raffle/advent/2023-12-frosty/opened/day13.png'
import boxOpen14 from 'assets/images/raffle/advent/2023-12-frosty/opened/day14.png'
import boxOpen15 from 'assets/images/raffle/advent/2023-12-frosty/opened/day15.png'
import boxOpen16 from 'assets/images/raffle/advent/2023-12-frosty/opened/day16.png'
import boxOpen17 from 'assets/images/raffle/advent/2023-12-frosty/opened/day17.png'
import boxOpen18 from 'assets/images/raffle/advent/2023-12-frosty/opened/day18.png'
import boxOpen19 from 'assets/images/raffle/advent/2023-12-frosty/opened/day19.png'
import boxOpen20 from 'assets/images/raffle/advent/2023-12-frosty/opened/day20.png'
import boxOpen21 from 'assets/images/raffle/advent/2023-12-frosty/opened/day21.png'
import boxOpen22 from 'assets/images/raffle/advent/2023-12-frosty/opened/day22.png'
import boxOpen23 from 'assets/images/raffle/advent/2023-12-frosty/opened/day23.png'
import boxOpen24 from 'assets/images/raffle/advent/2023-12-frosty/opened/day24.png'
import boxOpen25 from 'assets/images/raffle/advent/2023-12-frosty/opened/day25.png'
import boxClosed1 from 'assets/images/raffle/advent/2023-12-frosty/closed/day1.png'
import boxClosed2 from 'assets/images/raffle/advent/2023-12-frosty/closed/day2.png'
import boxClosed3 from 'assets/images/raffle/advent/2023-12-frosty/closed/day3.png'
import boxClosed4 from 'assets/images/raffle/advent/2023-12-frosty/closed/day4.png'
import boxClosed5 from 'assets/images/raffle/advent/2023-12-frosty/closed/day5.png'
import boxClosed6 from 'assets/images/raffle/advent/2023-12-frosty/closed/day6.png'
import boxClosed7 from 'assets/images/raffle/advent/2023-12-frosty/closed/day7.png'
import boxClosed8 from 'assets/images/raffle/advent/2023-12-frosty/closed/day8.png'
import boxClosed9 from 'assets/images/raffle/advent/2023-12-frosty/closed/day9.png'
import boxClosed10 from 'assets/images/raffle/advent/2023-12-frosty/closed/day10.png'
import boxClosed11 from 'assets/images/raffle/advent/2023-12-frosty/closed/day11.png'
import boxClosed12 from 'assets/images/raffle/advent/2023-12-frosty/closed/day12.png'
import boxClosed13 from 'assets/images/raffle/advent/2023-12-frosty/closed/day13.png'
import boxClosed14 from 'assets/images/raffle/advent/2023-12-frosty/closed/day14.png'
import boxClosed15 from 'assets/images/raffle/advent/2023-12-frosty/closed/day15.png'
import boxClosed16 from 'assets/images/raffle/advent/2023-12-frosty/closed/day16.png'
import boxClosed17 from 'assets/images/raffle/advent/2023-12-frosty/closed/day17.png'
import boxClosed18 from 'assets/images/raffle/advent/2023-12-frosty/closed/day18.png'
import boxClosed19 from 'assets/images/raffle/advent/2023-12-frosty/closed/day19.png'
import boxClosed20 from 'assets/images/raffle/advent/2023-12-frosty/closed/day20.png'
import boxClosed21 from 'assets/images/raffle/advent/2023-12-frosty/closed/day21.png'
import boxClosed22 from 'assets/images/raffle/advent/2023-12-frosty/closed/day22.png'
import boxClosed23 from 'assets/images/raffle/advent/2023-12-frosty/closed/day23.png'
import boxClosed24 from 'assets/images/raffle/advent/2023-12-frosty/closed/day24.png'
import boxClosed25 from 'assets/images/raffle/advent/2023-12-frosty/closed/day25.png'
import { getCachedSrc } from 'common/util'

export const getAdventImage = ({
  opened,
  day,
}: {
  opened: boolean
  day: number
}) => {
  const openedBoxes = {
    1: boxOpen1,
    2: boxOpen2,
    3: boxOpen3,
    4: boxOpen4,
    5: boxOpen5,
    6: boxOpen6,
    7: boxOpen7,
    8: boxOpen8,
    9: boxOpen9,
    10: boxOpen10,
    11: boxOpen11,
    12: boxOpen12,
    13: boxOpen13,
    14: boxOpen14,
    15: boxOpen15,
    16: boxOpen16,
    17: boxOpen17,
    18: boxOpen18,
    19: boxOpen19,
    20: boxOpen20,
    21: boxOpen21,
    22: boxOpen22,
    23: boxOpen23,
    24: boxOpen24,
    25: boxOpen25,
  }
  const closedBoxes = {
    1: boxClosed1,
    2: boxClosed2,
    3: boxClosed3,
    4: boxClosed4,
    5: boxClosed5,
    6: boxClosed6,
    7: boxClosed7,
    8: boxClosed8,
    9: boxClosed9,
    10: boxClosed10,
    11: boxClosed11,
    12: boxClosed12,
    13: boxClosed13,
    14: boxClosed14,
    15: boxClosed15,
    16: boxClosed16,
    17: boxClosed17,
    18: boxClosed18,
    19: boxClosed19,
    20: boxClosed20,
    21: boxClosed21,
    22: boxClosed22,
    23: boxClosed23,
    24: boxClosed24,
    25: boxClosed25,
  }

  return getCachedSrc({
    src: opened ? openedBoxes[day] : closedBoxes[day],
  })
}
