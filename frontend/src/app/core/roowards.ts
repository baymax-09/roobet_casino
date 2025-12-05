// roowardsWorker is the global roowards worker instance
export const roowardsWorker = new Worker(
  new URL('app/workers/roowards-worker', import.meta.url),
)

// stopRoowardsWorker
export function stopRoowardsWorker() {
  roowardsWorker.postMessage({ event: 'stop' })
}
