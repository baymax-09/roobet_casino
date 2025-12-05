import { type DBCollectionSchema } from 'src/modules'
import { r } from 'src/system'

export interface IPBanlistDocument {
  /** id is the banned IP Address */
  id: string
  timestamp: Date
}

const tableName = 'ipBanlist'
const IPBanlist = r.table<IPBanlistDocument>(tableName)

export async function banIp(ip: string): Promise<void> {
  await IPBanlist.get(ip).replace({ id: ip, timestamp: r.now() }).run()
}

export async function unbanIp(ip: string): Promise<void> {
  await IPBanlist.get(ip).delete().run()
}

export const getIPBanlist = async () => await IPBanlist.run()

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: tableName,
  indices: [{ name: 'timestamp' }],
}
