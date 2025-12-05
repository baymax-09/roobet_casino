/**
 * Used when you want to require at least one field from a type.
 * @link https://learn.microsoft.com/en-us/javascript/api/@azure/keyvault-certificates/requireatleastone?view=azure-node-latest
 */
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export type WithRequiredProperties<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property]
}

/** Used to narrow from a type nullish, optional, T to T. Particularly useful for filtering arrays. */
export const exists = <T>(item?: T | null | undefined): item is T =>
  item !== undefined && item !== null
