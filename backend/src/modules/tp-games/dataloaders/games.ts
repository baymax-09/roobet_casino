import DataLoader from 'dataloader'

import { TPGames } from 'src/modules/tp-games/documents'
import { loadOneToMany } from 'src/util/dataloader'

// Use the DataLoader to load the games for an array of tag ids
export const loadGamesByTagId = async (
  id: string,
): Promise<TPGames.TPGame[]> => {
  // Initialize a new DataLoader instance
  const gamesByTagIdLoader = new DataLoader<string, TPGames.TPGame[]>(
    async (
      tagIds: readonly string[],
    ): Promise<Array<TPGames.TPGame[] | null>> => {
      // Get all the games for these tag ids
      // ids are spread because the argument must be readonly
      const allGames = await TPGames.getAllApprovedAndEnabledGamesByTagIds([
        ...tagIds,
      ])

      // Map ids to their corresponding array of games
      const idToGames = new Map(
        tagIds.map(id => [
          id,
          allGames.filter(game => game?.tags?.includes(id)),
        ]),
      )

      // Return the tags for the specific id of each record
      return tagIds.map(id => idToGames.get(id) ?? null)
    },
    {
      name: 'gamesByTagId',
    },
  )

  return loadOneToMany<string, TPGames.TPGame>(id, gamesByTagIdLoader)
}
