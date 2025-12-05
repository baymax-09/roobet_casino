import { getUserByName } from 'src/modules/user/documents/user'
import { initUserSignup } from 'src/modules/user'

export async function testUsers() {
  const testUsers = [
    { username: 'test', email: 'test@test.com', password: 'test123456', countryCode: 'CA' },
    { username: 'bill', email: 'bill@test.com', password: 'billyboy12345', countryCode: 'CA' },
    { username: 'anne', email: 'anne@test.com', password: 'anne123456', countryCode: 'CA' },
    { username: 'doll', email: 'doll@test.com', password: 'doll123456', countryCode: 'CA' },
  ]
  for (let { username, email, password, countryCode, opts } of testUsers) {
    await initUserSignup({ username, email, password, countryCode, opts, session: { id: '', data: '' }, ip: '' })
  }
}

export async function getTestUser(username = 'test') {
  return await getUserByName(username, true)
}
