export const isFunction = functionToCheck => {
  return (
    functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
  )
}

export const isEmptyObject = obj => {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}
