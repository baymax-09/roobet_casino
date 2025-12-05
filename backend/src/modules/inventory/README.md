# Inventory

This module provides the backend code for everything related to the inventory system.

There are 3 separate inventory collections:

1. House Inventory
2. User Inventory
3. Archived Inventory

## House Inventory

The house inventory contains all the inventory items,created by our admins/officers, that are able to be given to users. Items usually will have a buff associated with them, and buffs can only be used bby the users.

HouseInventoryItem Field:

- `name`: Name of the Item
- `description`: Given description for the item. Usually describes intent for the item.
- `rarity`: Rarity for the item. Determined by the drop rate. Higher sought items will have a lower drop rate.
- `imageURl`: the image url associated with the item (stored in S3)
- `buffSettings`: Settings pertaining to the buff for the item. There are different types of buffs, so there may be different fields depending on the buff type. Example: The `FREE_BETS` buff will have `freeBetAmount`, `freeBetType`, and `games` associated with it.
- `usageSettings`: Settings used to determine how often, and how many times an item can be used.
- `quantity`: The quantity of that particular item that the house currently has in stock. When items are given to users, the quantity will decrease, and vice versa for user items given back to the house.

## User Inventory

Each user will have their own set of items in their inventory. Users can receive items in different ways, whether given to them by the house, transferred to them from another user, etc.

UserInventoryItem Field:

- `userId`: The UUID of the user that has the item.
- `houseInventoryItemId`: The house inventory item id that the item is associated to.
- `usageSettings`: Settings used to determine how often, and how many times an item can be used.

## Archived Inventory

The archived inventory contains all the items that have been removed from users. This will happen when a user has uses up all of their possible item usage, given by the items `usageSettings` and the item has `consumedOnDepletion` set to `true`. These items are removed from the user, also added back to the house, and moved into the archived inventory.

ArchivedInventoryItem Field:

- `userId`: The UUID of the user that has the item.
- `houseInventoryItemId`: The house inventory item id that the item is associated to.
- `usageSettings`: Settings used to determine how often, and how many times an item can be used.
- `archived`: Status that the item has been archived (only user for type assistance on nexus side).
