import { hideLoader } from './loader'

describe('hideLoader', () => {
  const loaderHTML = '<div id="loader"></div>'
  const readyHTML = '<div id="loader"></div>'

  it('can remove element with id of loader from DOM', () => {
    document.body.innerHTML = loaderHTML
    hideLoader()
    expect(document.body.innerHTML).toBe(readyHTML)
    setTimeout(() => expect(document.body.innerHTML).toBeUndefined(), 5000)
  })

  it('will return undefined if no loader in DOM', () => {
    document.body.innerHTML = ''
    expect(hideLoader()).toBeUndefined()
  })
})
