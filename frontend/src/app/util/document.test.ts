import { loadExternalScript, removeExternalScript } from './document'

describe('document', () => {
  const testSrc = 'https://testSrc.test.src/test.js'
  const testSrc2 = 'http://testSrc.test.src/test2.js'
  const testId = 987654321
  const result = {
    html: `<script src="${testSrc}" id="${testId}"></script>`,
    callback: false,
  }

  it('can add script to head', () => {
    expect(document.head.innerHTML).toBe('')
    loadExternalScript(testId, testSrc)
    expect(document.head.innerHTML).toBe(result.html)
  })

  it('can add script onload callback', () => {
    loadExternalScript(testId, testSrc, () => {
      result.callback = true
    })
    expect(document.head.innerHTML).toBe(result.html)
    expect(result.callback).toBe(true)
    result.callback = false
  })

  it('will not add scripts with duplicate ids', () => {
    loadExternalScript(testId, testSrc)
    loadExternalScript(testId, testSrc)
    loadExternalScript(testId, testSrc2)
    expect(document.head.innerHTML).toBe(result.html)
  })

  it('can remove script from head given the id', () => {
    loadExternalScript(testId, testSrc)
    expect(document.head.innerHTML).toBe(result.html)
    removeExternalScript(testId)
    expect(document.head.innerHTML).toBe('')
  })
})
