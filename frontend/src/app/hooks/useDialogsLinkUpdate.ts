import React from 'react'

import { DialogsCurrentContext, DialogsStateContext } from 'app/context'
import { history } from 'app/util'
import { type DialogKey } from 'app/dialogs/util'

import { useDialogsUpdate } from './useDialogsUpdate'
import { useDialogsClose } from './useDialogsClose'

type DialogLinkUpdater = (dialogId: `${number}`) => void

const noop = () => undefined

function getLink(key: DialogKey, link) {
  const { location } = history
  const search = new URLSearchParams(location.search)

  search.set('modal', key)

  for (const key in link) {
    search.set(key, link[key])
  }

  return `${location.pathname}?${search}`
}

function removeModalLink(key: DialogKey, link) {
  const { location } = history
  const search = new URLSearchParams(location.search)

  if (!search.get('modal') || search.get('modal') !== key) {
    return
  }

  search.delete('modal')

  for (const key in link) {
    search.delete(key)
  }

  history.push(`${location.pathname}?${search}`)
}

export const useIsDialogOpen = (dialogKey: DialogKey) => {
  const dialogState = React.useContext(DialogsStateContext)
  return dialogState?.active?.some(({ key }) => key === dialogKey)
}

export function useDialogsLinkUpdate(
  onUpdate: DialogLinkUpdater = noop,
  updateOnly = false,
) {
  const currentDialog = React.useContext(DialogsCurrentContext)

  if (currentDialog === undefined) {
    throw new Error(
      'useDialogsLinkUpdate must be used within a DialogsCurrentContext',
    )
  }

  const { id, key } = currentDialog
  const updateDialog = useDialogsUpdate()
  const previousLink = React.useRef(currentDialog.link)
  const closeDialog = useDialogsClose()

  React.useEffect(() => {
    updateDialog(id, dialog => onUpdate(dialog.link))
  }, [id, updateDialog, onUpdate])

  React.useEffect(() => {
    if (updateOnly) {
      return
    }

    const newLink = getLink(key, currentDialog.link)
    const oldLink = getLink(key, previousLink.current)

    if (newLink !== oldLink) {
      history.replace(newLink)
    }

    previousLink.current = currentDialog.link
  }, [updateOnly, key, currentDialog.link])

  React.useEffect(() => {
    if (updateOnly || !currentDialog.open) {
      return
    }

    const link = getLink(key, previousLink.current)
    history.push(link)

    return () => {
      removeModalLink(key, previousLink.current)
    }
  }, [updateOnly, key, currentDialog.open])

  React.useEffect(() => {
    if (updateOnly || !currentDialog.open) {
      return
    }

    const unsubscribe = history.listen((location, action) => {
      if (action === 'REPLACE') {
        return
      }

      const search = new URLSearchParams(location.search)

      if (!search.get(key)) {
        unsubscribe()
        closeDialog(id)
        // removeModalLink(key, previousLink.current)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [updateOnly, id, key, currentDialog.open, closeDialog])
}
