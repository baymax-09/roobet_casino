export const loadExternalScript = (
  id: string,
  src: string,
  callback: (() => unknown) | undefined = undefined,
) => {
  if (document.getElementById(id)) {
    return callback && callback()
  }
  const script = document.createElement('script')
  script.src = src
  script.id = id
  script.onload = () => {
    callback && callback()
  }
  document.head.appendChild(script)
}

export const removeExternalScript = id => {
  const script = document.getElementById(id)
  script && script.remove()
}
