import { api } from 'common/util'

const handleFastTrackGTMEvent = async (event: CustomEvent) => {
  const detail = event.detail
  // These should be set in our custom HTML script in GTM
  const { notificationType, data } = detail

  await api.post('/fasttrack/customGTM', {
    notificationType,
    data,
  })
}

export const initiateGTMFasttrackEventListener = () => {
  // @ts-expect-error it's a CustomEvent ok...
  window.addEventListener('fasttrackGTMEvent', handleFastTrackGTMEvent)
}
