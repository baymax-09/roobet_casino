export const PolicyEffects = ['deny', 'allow'] as const
export type PolicyEffect = (typeof PolicyEffects)[number]
