export const Categories = ['audit', 'operational'] as const
export type Category = (typeof Categories)[number]
