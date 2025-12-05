export const roowardsWorker = new Worker(new URL('localhost:9000/app/workers/roowards-worker'))

export function stopRoowardsWorker() {
  roowardsWorker.postMessage({ event: 'stop' })
}
