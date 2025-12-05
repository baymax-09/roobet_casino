const BlockioNotificationTypes = ['account', 'new-blocks', 'address'] as const
export type BlockioNotificationType = (typeof BlockioNotificationTypes)[number]
export const isBlockioNotificationType = (
  type: any,
): type is BlockioNotificationType => {
  return BlockioNotificationTypes.includes(type)
}
