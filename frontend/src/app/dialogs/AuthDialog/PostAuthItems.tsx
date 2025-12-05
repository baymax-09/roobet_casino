import React from 'react'

export const PostAuthItems = () => {
  // Capture query params for post-authentication use
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tagId = urlParams.get('tagId')
    const optName = urlParams.get('optName')
    const emb = urlParams.get('emb')
    if (tagId) {
      if (optName) {
        localStorage.setItem('optName', optName)
      }
      if (tagId.length > 0) {
        localStorage.setItem('tagId', tagId)
      }
    }
    if (emb && emb.length > 0) {
      localStorage.setItem('emb', emb)
    }
  }, [])

  return <></>
}
