import { useManyBuffs } from '../documents/items'
import { InventoryItemDAO } from '../lib'
import { inventoryLogger } from '../lib/logger'

async function getActiveRoowardsItems(userId: string) {
  const filter = {
    buffTypes: ['ROOWARDS'],
    isActive: true,
    userId,
  }
  return await InventoryItemDAO.getUserInventoryItems({ filter })
}

export async function getRoowardsBuffBoost(userId: string): Promise<number> {
  const activeRoowardsItems = await getActiveRoowardsItems(userId)
  if (activeRoowardsItems) {
    return activeRoowardsItems.reduce((acc, curr) => {
      if (
        curr?.buff?.buffSettings &&
        'roowardsModifier' in curr.buff.buffSettings
      ) {
        return acc + (curr.buff.buffSettings.roowardsModifier ?? 0) / 100
      }
      return acc
    }, 0)
  }
  return 0
}

/**
 * @todo even if we fail to mark these as used we still gave the modifier to the claim
 */
export async function useRoowardsBuffs(userId: string) {
  const logger = inventoryLogger('useRoowardsBuffs', { userId })
  let activeRoowardsItems
  let itemIds
  try {
    activeRoowardsItems = await getActiveRoowardsItems(userId)
    itemIds = activeRoowardsItems.map(item => item._id)
    const successful = await useManyBuffs(itemIds)
    if (!successful) {
      logger.error(`Failed to mark Roowards buffs as used`, {
        activeRoowardsItems,
        itemIds,
      })
    }
  } catch (error) {
    logger.error(
      `Failed to mark Roowards buffs as used`,
      {
        activeRoowardsItems,
        itemIds,
      },
      error,
    )
  }
}
