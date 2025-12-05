import {
  isAfter,
  addTimeInDuration,
  type Duration,
} from 'src/util/helpers/time'

import { HouseInventoryModel } from './houseInventory'
import { type ItemUsage } from './types'

export const isActive = (usageSettings: ItemUsage) => {
  const { lastUsedDate, hasLimitedUses, usesLeft, usageInterval } =
    usageSettings
  // If the item has limited uses and is out of uses, return false
  if (hasLimitedUses && usesLeft === 0) {
    return false
  }
  // If there is no usage interval type or the lastUsedDate is null, return true
  if (!usageInterval?.type || !lastUsedDate) {
    return true
  }
  const { type, frequency } = usageInterval

  // Return if the current time is greater than the last used date plus the usage interval
  return isAfter(
    new Date(),
    addTimeInDuration(frequency, type.toLowerCase() as Duration, lastUsedDate),
  )
}

const getIsActiveAddFields = () => {
  const addFields = {
    $addFields: {
      isActive: {
        $function: {
          body: isActive,
          args: ['$usageSettings'],
          lang: 'js',
        },
      },
    },
  }
  return addFields
}

const getIsActiveMatch = (isActive: boolean) => {
  return { isActive }
}

export const buildGetItemsAggSteps = ({
  isActive,
  buffTypes,
}: {
  isActive?: boolean
  buffTypes?: string[]
}) => {
  const aggregationSteps: any = []
  if (isActive) {
    aggregationSteps.push(getIsActiveAddFields())
    aggregationSteps.push({ $match: getIsActiveMatch(isActive) })
  }
  if (buffTypes) {
    aggregationSteps.push({ $match: { 'buff.type': { $in: buffTypes } } })
  }
  if (!aggregationSteps.length) {
    aggregationSteps.push({ $match: {} })
  }
  return aggregationSteps
}

export const buildHouseInventoryJoinSteps = () => {
  return [
    // Join the house inventory collection using the "foreign key" `houseInventoryItemId`
    {
      $lookup: {
        from: HouseInventoryModel.collection.name,
        localField: 'houseInventoryItemId',
        foreignField: '_id',
        as: 'houseItems',
      },
    },
    // Unwind the looked up `houseItems` array into the root of the document
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$houseItems', 0] }, '$$ROOT'],
        },
      },
    },
    // Remove unneeded lookup field
    { $project: { houseItems: 0 } },
    // Replace the template/default usage settings in the house inventory collection with
    // the values from the user inventory document
    {
      $addFields: {
        usageSettings: {
          lastUsedDate: '$lastUsedDate',
          usesLeft: '$usesLeft',
        },
      },
    },
  ]
}
