import React from 'react'

import { useIsLoggedIn, useTranslate } from 'app/hooks'
import { useToasts } from 'common/hooks'
import { history } from 'app/util'
import { createPlayerTag, linkEmberAccount } from 'app/lib/user'

export const PostLoginEffects: React.FC = () => {
  const { toast } = useToasts()
  const t = useTranslate()
  const isLoggedIn = useIsLoggedIn()

  React.useEffect(() => {
    if (!isLoggedIn) return

    const urlParams = new URLSearchParams(window.location.search)
    const tagId = urlParams.get('tagId') || localStorage.getItem('tagId')
    const optName = urlParams.get('optName') || localStorage.getItem('optName')
    const emb = urlParams.get('emb') || localStorage.getItem('emb')

    if (emb) {
      linkEmberAccount(emb)
        .then(response => {
          if (!response.success) {
            if (response.detail === 'User already linked to another account') {
              toast.error(`${t('ember.linkFailure')}`)
            }
          }
        })
        .catch(error => {
          console.error('Error linking ember account:', error)
        })
        .finally(() => {
          urlParams.delete('emb')
          localStorage.removeItem('emb')
          history.replace('/')
        })
    }

    if (tagId) {
      if (optName) {
        toast.success(`${t('generic.optIn')} ${optName}`, {
          autoHideDuration: 15000,
        })
        urlParams.delete('optName')
        localStorage.removeItem('optName')
      }
      createPlayerTag(tagId)
      localStorage.removeItem('tagId')
      urlParams.delete('tagId')
      history.replace(`${location.pathname}?${urlParams}`)
    }
  }, [isLoggedIn])

  return <></>
}
