import {
  type UpdatePayload,
  type FilterQuery,
  type ProjectionFields,
  type ClientSession,
  Types,
} from 'mongoose'
import { GraphQLError } from 'graphql'
import { pick } from 'underscore'

import { withTransaction } from 'src/system'

import { inventoryLogger } from '../lib/logger'
import {
  HouseInventoryModel,
  type HouseInventoryItem,
  type DBHouseInventoryItem,
} from './houseInventory'
import {
  UserInventoryModel,
  type UserInventoryItem,
  type DBUserInventoryItem,
} from './userInventory'
import {
  ArchivedInventoryModel,
  type ArchivedInventoryItem,
  type DBArchivedInventoryItem,
} from './archivedInventory'
import {
  buildGetItemsAggSteps,
  buildHouseInventoryJoinSteps,
} from './aggregationSteps'
import { createUserFreeSpins, cancelAllFreespins } from '../utils'
import { type ErrorFreeSpins, type ItemBuffType } from './types'

interface FilterInventoryQuery {
  inventory?: DBHouseInventoryItem | DBUserInventoryItem
  itemIds?: string[]
  userId?: string
  itemId?: string
}

interface FilterGetInventoryQuery extends FilterInventoryQuery {
  isActive?: boolean
  buffTypes?: ItemBuffType[]
  buffType?: ItemBuffType
}

interface FilterUpdateInventoryQuery extends FilterInventoryQuery {
  quantity?: number
}

interface InventoryItemCreateArgs {
  item: Omit<DBHouseInventoryItem, '_id'>
}

interface InventoryItemsGetArgs {
  filter: FilterQuery<FilterGetInventoryQuery>
  projection?: ProjectionFields<DBUserInventoryItem | DBHouseInventoryItem>
  session?: ClientSession
}

interface InventoryItemUpdateArgs {
  filter: FilterQuery<FilterUpdateInventoryQuery>
  payload?: UpdatePayload<DBHouseInventoryItem | DBUserInventoryItem>
}

interface InventoryItemRemoveArg {
  filter: FilterQuery<FilterInventoryQuery>
}

interface FilterFormatInventoryItemArg {
  item: DBUserInventoryItem | DBArchivedInventoryItem
}

interface FormatInventoryItemArg {
  filter: FilterQuery<FilterFormatInventoryItemArg>
  projection?: ProjectionFields<DBUserInventoryItem | DBArchivedInventoryItem>
}
export interface AddItemToInventoryInterface {
  itemId: Types.ObjectId
  quantity: number
  userId: string
  issuerId: string
  reason: string
}

// This performs the equivalent of a join on house items and returns a formatted item for User or Archived
const joinWithHouseInventory = async (
  { filter: { item }, projection }: FormatInventoryItemArg,
  session?: ClientSession,
): Promise<UserInventoryItem | ArchivedInventoryItem> => {
  const { houseInventoryItemId, userId, lastUsedDate, usesLeft } = item
  const houseItem = await getHouseItem(
    { filter: { itemId: item.houseInventoryItemId }, projection },
    session,
  )
  if (!houseItem) {
    throw new Error(
      `Missing record of id ${houseInventoryItemId} in ${HouseInventoryModel.collection.name} collection`,
    )
  }
  return {
    ...houseItem,
    usageSettings: {
      ...houseItem.usageSettings,
      lastUsedDate,
      usesLeft,
    },
    houseInventoryItemId,
    userId,
  }
}

/*
 * CREATE
 */

export async function createHouseItem({
  item,
}: InventoryItemCreateArgs): Promise<HouseInventoryItem> {
  const result: DBHouseInventoryItem = (
    await HouseInventoryModel.create(item)
  ).toObject()
  return result
}

export async function createUserItem(
  item: Omit<DBUserInventoryItem, '_id'>,
): Promise<UserInventoryItem> {
  const result: DBUserInventoryItem = (
    await UserInventoryModel.create(item)
  ).toObject()
  return (await joinWithHouseInventory({
    filter: { item: result },
  })) as UserInventoryItem
}

export async function createUserItemsInTransaction(
  items: Array<Omit<DBUserInventoryItem, '_id'>>,
  session: ClientSession,
) {
  return await UserInventoryModel.create(items, { session })
}

export async function createArchiveItems(
  items: Array<Omit<DBArchivedInventoryItem, '_id'>>,
  session: ClientSession,
) {
  return await ArchivedInventoryModel.create(items, { session })
}

/*
 * READ
 */

export async function getHouseInventoryItems({
  filter: { buffTypes },
}: InventoryItemsGetArgs): Promise<HouseInventoryItem[]> {
  const aggregations = buildGetItemsAggSteps({ buffTypes })
  return await HouseInventoryModel.aggregate(aggregations)
}

export async function getUserInventoryItems({
  filter: { isActive, userId, buffTypes },
}: InventoryItemsGetArgs): Promise<UserInventoryItem[]> {
  const aggregations = [
    // First match on user id
    { $match: { userId } },
    // Then, join on the house inventory
    ...buildHouseInventoryJoinSteps(),
    // Finally, filter
    ...buildGetItemsAggSteps({ isActive, buffTypes }),
  ]
  return await UserInventoryModel.aggregate(aggregations)
}

export async function getHouseItemsByItemIds({
  filter: { itemIds },
  projection,
}: InventoryItemsGetArgs): Promise<HouseInventoryItem[]> {
  return await HouseInventoryModel.find(
    { _id: { $in: itemIds } },
    { ...(projection && { ...projection }) },
  ).lean<HouseInventoryItem[]>()
}

export async function getUserItemsByIds({
  filter: { itemIds },
  projection,
  session,
}: InventoryItemsGetArgs): Promise<UserInventoryItem[]> {
  const aggregations: any[] = [
    {
      $match: {
        _id: {
          $in: itemIds.map((itemId: string) => new Types.ObjectId(itemId)),
        },
      },
    },
    ...buildHouseInventoryJoinSteps(),
  ]

  if (projection) {
    aggregations.push({ $project: projection })
  }

  return await UserInventoryModel.aggregate(aggregations, {
    ...(session && { session }),
  })
}

export async function getHouseItem(
  { filter: { itemId }, projection }: InventoryItemsGetArgs,
  session?: ClientSession,
): Promise<HouseInventoryItem | null> {
  return await HouseInventoryModel.findOne(
    { _id: itemId },
    { ...(projection && { ...projection }) },
    { ...(session && { session }) },
  ).lean<DBHouseInventoryItem>()
}

export async function getUserItem({
  filter: { itemId },
}: InventoryItemsGetArgs): Promise<UserInventoryItem | null> {
  const res = await UserInventoryModel.findOne({
    _id: itemId,
  }).lean<DBUserInventoryItem>()
  return res
    ? ((await joinWithHouseInventory({
        filter: { item: res },
      })) as UserInventoryItem)
    : null
}

export async function getUserItems({
  filter: { itemId },
}: InventoryItemsGetArgs): Promise<UserInventoryItem | null> {
  const res = await UserInventoryModel.find({
    _id: itemId,
  }).lean<DBUserInventoryItem>()
  return res
    ? ((await joinWithHouseInventory({
        filter: { item: res },
      })) as UserInventoryItem)
    : null
}

export async function getUserItemByBuffType({
  filter: { itemId, buffType },
  projection,
}: InventoryItemsGetArgs): Promise<UserInventoryItem | null> {
  const res = await UserInventoryModel.findOne({
    _id: itemId,
    'buff.type': buffType,
  }).lean<DBUserInventoryItem>()
  return res
    ? ((await joinWithHouseInventory({
        filter: { item: res },
        projection,
      })) as UserInventoryItem)
    : null
}

/*
 * UPDATE
 */

export const addItemsToUserInventory = async (
  data: AddItemToInventoryInterface,
) => {
  // Validation step
  const { itemId, quantity, userId, issuerId, reason } = data
  const logger = inventoryLogger('addItemsToUserInventory', { userId })
  const filter: FilterQuery<FilterUpdateInventoryQuery> = {
    itemId,
    quantity: -quantity,
  }

  const currentHouseItem = await getHouseItem({
    filter: { itemId: data.itemId },
    projection: { quantity: 1, hasInfiniteQuantity: 1, buff: 1 },
  })
  // Checking current quantity since mongoose validators don't run on $inc updates
  if (!currentHouseItem) {
    throw new GraphQLError('House Item does not exist', {})
  }

  if (
    currentHouseItem.quantity < data.quantity &&
    !currentHouseItem.hasInfiniteQuantity
  ) {
    throw new GraphQLError('Quantity cannot be less than 0', {})
  }
  // Run the updates and create in transaction
  try {
    const dataResult = await withTransaction(async withSession => {
      const updatedHouseItem = await withSession(async session => {
        return await incrementHouseItemQuantity({ filter }, session)
      })

      if (updatedHouseItem) {
        const picked = pick(updatedHouseItem.usageSettings, [
          'lastUsedDate',
          'usesLeft',
        ])
        const userItemsToCreate = new Array(data.quantity).fill({
          ...picked,
          userId,
          houseInventoryItemId: updatedHouseItem._id,
        })
        await withSession(async session => {
          const userItems = await createUserItemsInTransaction(
            userItemsToCreate,
            session,
          )
          // Manually useBuff if type === FREE_SPINS
          // Keeps track of the freespins dispersed in case of errors
          const errorsFreeSpins: ErrorFreeSpins = {
            pragmaticBonusCodes: [],
            softswissIssueIds: [],
            hacksawExternalOfferIds: [],
          }
          try {
            if (currentHouseItem.buff.type === 'FREE_SPINS') {
              await useManyBuffsWithActiveSession(
                userItems.map(userItem => userItem._id),
                session,
              )
              // Doesn't need the session object, but will "rollback" these changes if there is an error.
              // Will be caught in the "catch" block and handled in the "cancelAllFreespins" function.
              // We can't pass in a session object since we are making external API calls.
              await createUserFreeSpins(
                userItems,
                currentHouseItem,
                userId,
                errorsFreeSpins,
                issuerId,
                reason,
              )
            }
          } catch (error) {
            logger.error(
              `Failed to add items to user inventory`,
              {
                userItems,
                item: currentHouseItem,
                errorsFreeSpins,
                issuerId,
                reason,
              },
              error,
            )
            // Cancel the free spins if they were already given out to the user
            await cancelAllFreespins(errorsFreeSpins, userId)
            throw error
          }
          return userItems
        })
        return updatedHouseItem
      }
    })
    if (!dataResult) {
      logger.error(
        'addItemsToInventory could not create user items, transaction failed',
        { item: currentHouseItem, quantity, issuerId, reason },
      )
      throw new GraphQLError(
        'Could not create user items, transaction failed',
        {},
      )
    }
    return dataResult
  } catch (error) {
    logger.error(
      'addItemsToInventory could not create user items, transaction failed',
      { item: currentHouseItem, quantity, issuerId, reason },
      error,
    )
    throw new GraphQLError(
      'Could not create user items, transaction failed',
      {},
    )
  }
}

export const addItemsToUserInventoryForFreeSpins = async (
  data: AddItemToInventoryInterface,
  errorsFreeSpins: ErrorFreeSpins,
  session: ClientSession,
) => {
  const { itemId, quantity, userId, issuerId, reason } = data
  const filter: FilterQuery<FilterUpdateInventoryQuery> = {
    itemId,
    quantity: -quantity,
  }

  const currentHouseItem = await getHouseItem({
    filter: { itemId: data.itemId },
    projection: { quantity: 1, hasInfiniteQuantity: 1, buff: 1 },
  })
  // Checking current quantity since mongoose validators don't run on $inc updates
  if (!currentHouseItem) {
    throw new Error('House Item does not exist')
  }

  if (
    currentHouseItem.quantity < data.quantity &&
    !currentHouseItem.hasInfiniteQuantity
  ) {
    throw new Error('Quantity cannot be less than 0')
  }

  // Run the updates and create in transaction
  try {
    const updatedHouseItem = await incrementHouseItemQuantity(
      { filter },
      session,
    )

    if (updatedHouseItem) {
      const picked = pick(updatedHouseItem.usageSettings, [
        'lastUsedDate',
        'usesLeft',
      ])
      const userItemsToCreate = new Array(data.quantity).fill({
        ...picked,
        userId,
        houseInventoryItemId: updatedHouseItem._id,
      })
      // Manually useBuff if type === FREE_SPINS
      const userItems = await createUserItemsInTransaction(
        userItemsToCreate,
        session,
      )
      if (currentHouseItem.buff.type === 'FREE_SPINS') {
        await useManyBuffsWithActiveSession(
          userItems.map(userItem => userItem._id),
          session,
        )
        await createUserFreeSpins(
          userItems,
          currentHouseItem,
          userId,
          errorsFreeSpins,
          issuerId,
          reason,
        )
      }
      return updatedHouseItem
    }
  } catch (error) {
    throw new Error(
      `[inventory] - addItemsToInventory could not create user items for user: ${userId}`,
      error,
    )
  }
}

export const removeItemsFromUserInventory = async (itemIds: string[]) => {
  const userItems = await getUserItemsByIds({ filter: { itemIds } })

  if (userItems.length !== itemIds.length) {
    throw new GraphQLError(
      'One or more of the items to remove does not exist',
      {},
    )
  }
  const houseInventoryIds = userItems.map(item => item.houseInventoryItemId)

  const successfulTransaction = await withTransaction(async withSession => {
    const deleteUserItemsQuery = [
      {
        deleteMany: {
          filter: { _id: { $in: itemIds.map(id => new Types.ObjectId(id)) } },
        },
      },
    ]

    const updateQuantityAmounts = houseInventoryIds.map(id => {
      return {
        updateOne: {
          filter: { _id: id },
          update: { $inc: { quantity: 1 } },
        },
      }
    })

    const userResult = await withSession(async session => {
      return await UserInventoryModel.bulkWrite(deleteUserItemsQuery, {
        session,
      })
    })
    if (userResult.deletedCount !== itemIds.length) {
      throw new GraphQLError('Could not delete user items', {})
    }

    const houseResult = await withSession(async session => {
      return await HouseInventoryModel.bulkWrite(updateQuantityAmounts, {
        session,
      })
    })
    if (houseResult.modifiedCount !== updateQuantityAmounts.length) {
      throw new GraphQLError('Could not update quantity of items', {})
    }
    return true
  })
  if (!successfulTransaction) {
    inventoryLogger('removeItemsFromUserInventory', {
      userId: userItems[0].userId,
    }).error(
      'removeItemsFromUserInventory could not create user items, transaction failed',
      { userItems },
    )
    throw new GraphQLError('Could not remove items, transaction failed', {})
  }
  return await getHouseItemsByItemIds({
    filter: { itemIds: houseInventoryIds },
  })
}

const mutateItemUsage = (userItem: UserInventoryItem) => {
  const {
    usageSettings: { usesLeft, hasLimitedUses },
  } = userItem
  // Does the item have usage?
  if (!hasLimitedUses || (usesLeft && usesLeft > 0)) {
    userItem.usageSettings.lastUsedDate = new Date()
    // Decrement uses left if it has limited uses
    if (hasLimitedUses && usesLeft && usesLeft > 0) {
      userItem.usageSettings.usesLeft -= 1
    }
    return userItem
  }
  return userItem
}

const filterUseableItems = (userItem: UserInventoryItem) => {
  const {
    usageSettings: { usesLeft, hasLimitedUses },
  } = userItem
  return !hasLimitedUses || (usesLeft && usesLeft > 0)
}

export const useManyBuffs = async (itemIds: Types.ObjectId[]) => {
  // Validation step
  const userItems = await getUserItemsByIds({ filter: { itemIds } })
  if (!userItems.length || userItems.length !== itemIds.length) {
    throw new Error('One or more of the items to use does not exist')
  }
  const useableItems = userItems.filter(filterUseableItems)
  if (useableItems.length !== itemIds.length) {
    throw new Error('One or more of the items has no uses left')
  }

  const successfulTransaction = await withTransaction(async withSession => {
    const updatedUserItems = userItems.map(mutateItemUsage)

    const itemsToDeleteAndArchive = updatedUserItems.filter(item => {
      return (
        item.usageSettings.consumedOnDepletion &&
        item.usageSettings.usesLeft === 0
      )
    })
    const itemsToUpdate = updatedUserItems.filter(item => {
      return (
        item.usageSettings.usesLeft !== 0 ||
        !item.usageSettings.consumedOnDepletion
      )
    })
    const idsToDelete = itemsToDeleteAndArchive.map(item => item._id)
    const createArchiveQuery = itemsToDeleteAndArchive.map(item => {
      const { _id, ...filteredUserBuffItem } = item
      const archivedItem: Omit<DBArchivedInventoryItem, '_id'> = {
        ...filteredUserBuffItem,
        usesLeft: 0,
        lastUsedDate: item.usageSettings.lastUsedDate,
      }
      return {
        insertOne: {
          document: archivedItem,
        },
      }
    })

    const deleteUserItemQuery = [
      {
        deleteMany: {
          filter: { _id: { $in: idsToDelete } },
        },
      },
    ]

    const updateUserItemQuery = itemsToUpdate.map(item => {
      return {
        updateOne: {
          filter: { _id: item._id },
          update: {
            usesLeft: item.usageSettings.usesLeft,
            lastUsedDate: item.usageSettings.lastUsedDate,
          },
        },
      }
    })

    if (itemsToDeleteAndArchive.length) {
      const archiveReturn = await withSession(async session => {
        return await ArchivedInventoryModel.bulkWrite(createArchiveQuery, {
          session,
        })
      })
      // TODO: Delete me when done testing
      if (archiveReturn.insertedCount !== itemsToDeleteAndArchive.length) {
        throw new Error('Could not archive items, transaction aborted')
      }

      const deleteItemsReturn = await withSession(async session => {
        return await UserInventoryModel.bulkWrite(deleteUserItemQuery, {
          session,
        })
      })
      if (deleteItemsReturn.deletedCount !== idsToDelete.length) {
        throw new Error(
          'Could not remove expired user items, transaction aborted',
        )
      }
    }

    if (itemsToUpdate.length) {
      const updateReturn = await withSession(async session => {
        return await UserInventoryModel.bulkWrite(updateUserItemQuery, {
          session,
        })
      })
      if (updateReturn.modifiedCount !== itemsToUpdate.length) {
        throw new Error('Could not update user items, transaction aborted')
      }
    }
    return true
  })

  return successfulTransaction
}

export const useManyBuffsWithActiveSession = async (
  itemIds: Types.ObjectId[],
  session: ClientSession,
) => {
  // Validation step
  const userItems = await getUserItemsByIds({ filter: { itemIds }, session })
  if (!userItems.length || userItems.length !== itemIds.length) {
    throw new Error('One or more of the items to use does not exist')
  }
  const useableItems = userItems.filter(filterUseableItems)
  if (useableItems.length !== itemIds.length) {
    throw new Error('One or more of the items has no uses left')
  }

  const updatedUserItems = userItems.map(mutateItemUsage)

  const itemsToDeleteAndArchive = updatedUserItems.filter(item => {
    return (
      item.usageSettings.consumedOnDepletion &&
      item.usageSettings.usesLeft === 0
    )
  })
  const itemsToUpdate = updatedUserItems.filter(item => {
    return (
      item.usageSettings.usesLeft !== 0 ||
      !item.usageSettings.consumedOnDepletion
    )
  })
  const idsToDelete = itemsToDeleteAndArchive.map(item => item._id)
  const createArchiveQuery = itemsToDeleteAndArchive.map(item => {
    const { _id, ...filteredUserBuffItem } = item
    const archivedItem: Omit<DBArchivedInventoryItem, '_id'> = {
      ...filteredUserBuffItem,
      usesLeft: 0,
      lastUsedDate: item.usageSettings.lastUsedDate,
    }
    return {
      insertOne: {
        document: archivedItem,
      },
    }
  })

  const deleteUserItemQuery = [
    {
      deleteMany: {
        filter: { _id: { $in: idsToDelete } },
      },
    },
  ]

  const updateUserItemQuery = itemsToUpdate.map(item => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: {
          usesLeft: item.usageSettings.usesLeft,
          lastUsedDate: item.usageSettings.lastUsedDate,
        },
      },
    }
  })

  if (itemsToDeleteAndArchive.length) {
    const archiveReturn = await ArchivedInventoryModel.bulkWrite(
      createArchiveQuery,
      { session },
    )

    if (archiveReturn.insertedCount !== itemsToDeleteAndArchive.length) {
      throw new Error('Could not archive items, transaction aborted')
    }

    const deleteItemsReturn = await UserInventoryModel.bulkWrite(
      deleteUserItemQuery,
      { session },
    )

    if (deleteItemsReturn.deletedCount !== idsToDelete.length) {
      throw new Error(
        'Could not remove expired user items, transaction aborted',
      )
    }
  }

  if (itemsToUpdate.length) {
    const updateReturn = await UserInventoryModel.bulkWrite(
      updateUserItemQuery,
      { session },
    )
    if (updateReturn.modifiedCount !== itemsToUpdate.length) {
      throw new Error('Could not update user items, transaction aborted')
    }
  }
  return true
}

export async function useBuff({
  itemId,
}: {
  itemId: string
}): Promise<UserInventoryItem | null> {
  const filter = { itemId }

  const userBuffItem = await getUserItem({ filter })
  // validation step
  if (userBuffItem) {
    const successfulTransaction = await withTransaction(async withSession => {
      const {
        usageSettings: { usesLeft, hasLimitedUses, consumedOnDepletion },
      } = userBuffItem
      // Does the item have usage?
      if (!hasLimitedUses || (usesLeft && usesLeft > 0)) {
        userBuffItem.usageSettings.lastUsedDate = new Date()
        // Decrement uses left if it has limited uses
        if (hasLimitedUses && usesLeft && usesLeft > 0) {
          userBuffItem.usageSettings.usesLeft -= 1
          // archive if it is the last use
          if (
            consumedOnDepletion &&
            userBuffItem.usageSettings.usesLeft === 0
          ) {
            const { _id, ...filteredUserBuffItem } = userBuffItem
            const archivedItem: Omit<DBArchivedInventoryItem, '_id'> = {
              ...filteredUserBuffItem,
              usesLeft: 0,
              lastUsedDate: userBuffItem.usageSettings.lastUsedDate,
            }
            await withSession(async session => {
              return await createArchiveItems([archivedItem], session)
            })
            return await withSession(async session => {
              return await removeUserItem({ filter }, session)
            })
          }
        }
        // Otherwise we update the item usage and return it
        const updatePayload: Omit<
          DBUserInventoryItem,
          '_id' | 'userId' | 'houseInventoryItemId'
        > = {
          usesLeft: userBuffItem.usageSettings.usesLeft,
          lastUsedDate: userBuffItem.usageSettings.lastUsedDate,
        }
        return await withSession(async session => {
          return await updateUserItem(
            {
              filter,
              payload: updatePayload,
            },
            session,
          )
        })
      }
    })

    if (!successfulTransaction) {
      inventoryLogger('useBuff', { userId: userBuffItem.userId }).error(
        'useBuff could not create user items, transaction failed',
        { item: userBuffItem },
      )
      throw new GraphQLError(
        'Could not useBuff on item, transaction failed',
        {},
      )
    }
    return successfulTransaction
  }
  return null
}

export async function upsertUserItem({
  filter: { itemId },
  payload,
}: InventoryItemUpdateArgs): Promise<UserInventoryItem | null> {
  const res: DBUserInventoryItem | null =
    await UserInventoryModel.findOneAndUpdate({ _id: itemId }, payload, {
      new: true,
      upsert: true,
    })
  return res
    ? ((await joinWithHouseInventory({
        filter: { item: res },
      })) as UserInventoryItem)
    : null
}

export async function updateHouseItem({
  filter: { itemId },
  payload,
}: InventoryItemUpdateArgs): Promise<HouseInventoryItem | null> {
  return await HouseInventoryModel.findOneAndUpdate({ _id: itemId }, payload, {
    new: true,
  })
}

export async function updateUserItem(
  { filter: { itemId }, payload }: InventoryItemUpdateArgs,
  session?: ClientSession,
): Promise<UserInventoryItem | null> {
  const res: DBUserInventoryItem | null =
    await UserInventoryModel.findOneAndUpdate({ _id: itemId }, payload, {
      new: true,
      ...(session && { session }),
    })
  return res
    ? ((await joinWithHouseInventory(
        { filter: { item: res } },
        session,
      )) as UserInventoryItem)
    : null
}

export async function incrementHouseItemQuantity(
  { filter: { itemId, quantity = 1 } }: InventoryItemUpdateArgs,
  session?: ClientSession,
) {
  return await HouseInventoryModel.findOneAndUpdate(
    { _id: itemId },
    [
      {
        $set: {
          quantity: {
            $sum: [
              '$quantity',
              { $cond: [{ $ne: ['$hasInfiniteQuantity', true] }, quantity, 0] },
            ],
          },
        },
      },
    ],
    { new: true, ...(session && { session }) },
  ).lean<DBHouseInventoryItem>()
}

export async function updateUserItems({
  filter,
  payload,
}: InventoryItemUpdateArgs): Promise<void> {
  await UserInventoryModel.updateMany(filter, payload)
}

/*
 * DELETE
 */

export async function removeHouseItem({
  filter: { itemId },
}: InventoryItemRemoveArg): Promise<HouseInventoryItem | null> {
  const res: DBHouseInventoryItem | null =
    await HouseInventoryModel.findOneAndDelete({
      _id: itemId,
    }).lean<DBHouseInventoryItem>()
  return res
}

export async function removeUserItem(
  { filter: { itemId } }: InventoryItemRemoveArg,
  session?: ClientSession,
): Promise<UserInventoryItem | null> {
  const res: DBUserInventoryItem | null =
    await UserInventoryModel.findOneAndDelete(
      { _id: itemId },
      { ...(session && { session }) },
    ).lean<DBUserInventoryItem>()

  return res
    ? ((await joinWithHouseInventory(
        { filter: { item: res } },
        session,
      )) as UserInventoryItem)
    : null
}
