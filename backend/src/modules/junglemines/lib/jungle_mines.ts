import { type JungleMinesDeck } from '../documents/active_jungle_mines_games'

export const GROUP_SIZE = 25

export function setOrderedGroup(
  minesCount: number,
  shuffledGroup: number[],
): JungleMinesDeck {
  const orderedGroup = {}

  if (minesCount < 1) {
    minesCount = 1
  }

  if (minesCount > 24) {
    minesCount = 24
  }

  shuffledGroup.forEach((card, index) => {
    if (index < minesCount) {
      // @ts-expect-error number indexing POJO
      orderedGroup[card] = 'mine'
    }

    if (index >= minesCount) {
      // @ts-expect-error number indexing POJO
      orderedGroup[card] = 'diamond'
    }
  })

  // @ts-expect-error incrementally adding fields to object above
  return orderedGroup
}
