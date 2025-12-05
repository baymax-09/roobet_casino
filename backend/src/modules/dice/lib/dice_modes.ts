export const DiceModes = [
  'under',
  'over',
  'between',
  'outside',
  'between-sets',
] as const
export type DiceMode = (typeof DiceModes)[number]

export function needsTargetNumberEnd(mode: DiceMode) {
  return mode === 'between' || mode === 'outside' || mode === 'between-sets'
}

export function needsTargetNumberSecondSet(mode: DiceMode) {
  return mode === 'between-sets'
}
