import { createDefaultSettings } from 'src/modules/siteSettings/documents/settings'

export async function testSettings() {
  await createDefaultSettings()
}
