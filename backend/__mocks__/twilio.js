const mockConferences = () => ({
  participants: () => (
    { update: () => Promise.resolve({}) }
  ),
})

mockConferences.list = () => Promise.resolve([])

class Twilio {
  constructor (sid, token) {
    this.calls = {
      create: () => Promise.resolve({ foo: 'bar' }),
      list: () => Promise.resolve([{ sid: '123' }]),
    }
    this.conferences = mockConferences
    this.taskrouter = {
      workspaces: () => {
        return {
          workers: {
            list: () => [{ attributes: '{}' }],
          },
          tasks: () => ({
            fetch: () => ({ attributes: '' }),
          }),
        }
      },
    }
    this.verify = {
      services: {
        create: jest.fn(),
      },
    }
  }
}

module.exports = (sid, token) => new Twilio(sid, token)
