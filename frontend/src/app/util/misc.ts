export async function waitUntil(condition) {
  return await new Promise(resolve => {
    const interval = setInterval(() => {
      if (condition) {
        resolve(true)
        clearInterval(interval)
      }
    }, 1000)
  })
}

export function addScript(src, callback) {
  const script = document.createElement('script')
  script.setAttribute('src', src)
  script.onload = callback
  document.body.appendChild(script)
}

export function isPrerenderIo() {
  return navigator?.userAgent?.includes('Prerender')
}
