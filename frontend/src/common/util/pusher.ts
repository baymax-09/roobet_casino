import Pusher from 'pusher-js'

let pusherInstance: Pusher | null = null

export const setPusherInstance = (pusherKey: string, authEndpoint: string) => {
  pusherInstance = new Pusher(pusherKey, {
    channelAuthorization: {
      endpoint: authEndpoint,
      transport: 'ajax',
    },
    cluster: 'eu', // TODO: don't hardcode this one. Use dynamic from config api
    forceTLS: true,
    enableStats: false,
  })
}

export const getPusherInstance = () => {
  if (!pusherInstance) {
    return null
  }
  return pusherInstance
}

// Initiate pusher
export const initiateFasttrackPusher = (
  pusherKey: string,
  authEndpoint: string,
) => {
  setPusherInstance(pusherKey, authEndpoint)
}
