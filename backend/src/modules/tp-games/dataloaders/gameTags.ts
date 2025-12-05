import DataLoader from 'dataloader'

import { GameTags } from 'src/modules/tp-games/documents'
import { loadManyToMany } from 'src/util/dataloader'

// Use the DataLoader to load the tags for an array of tag ids
export const loadGameTags = async (
  ids?: string[],
): Promise<GameTags.GameTag[]> => {
  if (!ids || !ids.length) return []

  // Initialize a new DataLoader instance
  const gameTagsLoader = new DataLoader<string, GameTags.GameTag | null>(
    async (
      tagIds: readonly string[],
    ): Promise<Array<GameTags.GameTag | null>> => {
      // Get all the tags for these ids
      // ids are spread because the argument must be readonly
      const allTags = await GameTags.getTagsById([...tagIds])

      // Map ids to their corresponding array of game tags
      const idToTags = new Map(
        tagIds.map(id => [
          id,
          allTags.find(({ _id }) => _id.toString() === id) ?? null,
        ]),
      )

      // Return the tags for the specific id of each record
      return tagIds.map(id => idToTags.get(id) ?? null)
    },
    {
      name: 'gameTags',
    },
  )

  return loadManyToMany<string, GameTags.GameTag>(ids, gameTagsLoader)
}
