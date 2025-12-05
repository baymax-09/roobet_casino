# README

This README provides an overview of the patterns and implementation of DataLoader.

## Summary

DataLoader is a utility library used to efficiently batch and cache data fetching operations. It helps optimize the performance of applications that need to retrieve data from external sources, such as databases or APIs.

The main purpose of DataLoader is to reduce the number of redundant or duplicate data requests. It achieves this by batching multiple requests together and fetching the data in a single call. This can significantly improve the efficiency of data fetching operations, especially when dealing with complex or nested data structures.

Additionally, DataLoader provides a caching mechanism that stores the fetched data in memory. This means that if the same data is requested again, DataLoader can quickly retrieve it from the cache instead of making another request to the data source. Caching helps reduce the overall response time and minimizes the load on external resources.

## Example

### DataLoader Instance Definition

```typescript
export const loadGameTags = async (
  ids?: string[],
): Promise<GameTags.GameTag[]> => {
  if (!ids || !ids.length) return []

  const gameTagsLoader = new DataLoader<string, GameTags.GameTag | null>(
    async (
      tagIds: readonly string[],
    ): Promise<Array<GameTags.GameTag | null>> => {
      // This is the bulk loader function. The DataLoader will coalesce all of the ids passed into the `load`
      // function across the entire request, and will query for them all at once.
      const allTags = await GameTags.getTagsById([...tagIds])

      // Here the bulk data is restructured into a hash map for easy access by id.
      const idToTags = new Map(
        tagIds.map((_id, index) => [_id, allTags[index]]),
      )

      // Finally, we return the mapping of the individual _ids to the result set in the above hashmap.
      // This makes the batch data available to the in-memory cache.
      return tagIds.map(_id => idToTags.get(_id) ?? null)
    },
    {
      // This name is used when logging errors.
      name: 'gameTags',
    },
  )

  // Using the `loadAll` utility, it is easy to fetch all records.
  // The first type parameter is the expected type of the _id, in this case, a string.
  // The second type parameter is the expected type of the record that corresponds to that _id, in this case a GameTag.
  // The ids are the ids of the records you wish to load, and the gameTagsLoader is the loader defined above.
  return loadAll<string, GameTags.GameTag>(ids, gameTagsLoader)
}
```

### GraphQL Field Resolver Implementation

```typescript
type.field('tags', {
  type: list(nonNull('GameTag')),
  auth: null,
  resolve: async ({ tags: tagIds }) => {
    // Here we simply have to call `loadGameTags` and DataLoader will magically do the rest.
    // The `tagIds` of all the TPGames in this request will be coalesced into a single bulk query.
    return await DataLoaders.loadGameTags(tagIds)
  },
})
```

## Conclusion

The README also provides a practical example of DataLoader's usage in a GraphQL context, demonstrating how it can be used to efficiently load game tags associated with a game. However, it's important to note that DataLoader's utility is not limited to GraphQL. It can be applied in any scenario that requires batch loading of data, making it a versatile tool for many different applications and use cases.
