/**
 * This list should be updated as additional
 * types are added to the backend.
 */
export const TPGameBlockedFields = ['providerInternal', 'category'] as const

export interface BlockedGamesChunk {
  id?: string
  key: (typeof TPGameBlockedFields)[number]
  value: string
}
