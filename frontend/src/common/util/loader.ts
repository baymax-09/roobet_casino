import { events } from 'common/core/events'

const loaderPreconditions = {
  route: false,
  settings: false,
  account: false,
}

type LoaderPrecondition = keyof typeof loaderPreconditions

export const mountLoaderListener = () => {
  events.on('loaderpreconditions', (condition: LoaderPrecondition[]) => {
    condition.forEach(con => {
      if (con in loaderPreconditions) {
        loaderPreconditions[con] = true
      }
    })
    hideLoader()
  })
}

export function hideLoader(force?: boolean) {
  const loader = document.getElementById('loader')

  if (!loader) {
    return
  }
  const preconditionsMet = Object.values(loaderPreconditions).every(
    condition => condition,
  )
  const shouldHide = preconditionsMet || force

  if (shouldHide) {
    loader.classList.add('ready')
    setTimeout(() => loader.remove(), 5000)
  }
}
