/**
 * Get a random seed of a given length.
 * @param length The length of the seed to generate (default: 256).
 * @returns A random seed.
 */
export function getRandomSeed(length = 256): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return new Array(length)
    .fill(0)
    .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
    .join('')
}
