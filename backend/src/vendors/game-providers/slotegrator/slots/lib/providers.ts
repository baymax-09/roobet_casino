/**
 * List of 'internal' provider names enabled for Slotegrator Slots.
 */
const SLOTEGRATOR_SLOTS_PROVIDERS_INTERNAL = [
  'igrosoft',
  'eurasiangamingbingo',
  'eurasiangamingslots',
  'g.games',
  'slotmill',
  'pgsoft',
] as const

export type SlotegratorSlotsProvidersInternal =
  (typeof SLOTEGRATOR_SLOTS_PROVIDERS_INTERNAL)[number]

export const isValidSlotegratorSlotsProviderInternal = (
  providerInternal: string,
): providerInternal is SlotegratorSlotsProvidersInternal =>
  (SLOTEGRATOR_SLOTS_PROVIDERS_INTERNAL as readonly string[]).includes(
    providerInternal,
  )
