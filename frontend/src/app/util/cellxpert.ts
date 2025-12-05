import moment from 'moment'

import { getCookieItem, removeCookieItem, setCookieItem } from './cookies'
import { getStorageItem, removeStorageItem, setStorageItem } from './storage'

const isJsonString = (value: string) => {
  try {
    JSON.parse(value)
  } catch {
    return false
  }

  return true
}

const DEFAULT_CELLXPERT_VALUES = {
  cxd: undefined,
  cxAffId: undefined,
}

const expireCellxpertLocalStorage = () => {
  removeStorageItem('cellxpert')
  removeCookieItem('cellxpert')

  return DEFAULT_CELLXPERT_VALUES
}

const parseCellxpertLocalStorageItem = (
  stringifiedLocalStorageObject: string,
) => {
  if (!isJsonString(stringifiedLocalStorageObject)) {
    return DEFAULT_CELLXPERT_VALUES
  }

  const { cxd, cxAffId, expiry } = JSON.parse(
    stringifiedLocalStorageObject,
  ) as { cxd: string; cxAffId: string; expiry: string }

  if (moment().isAfter(expiry)) {
    return expireCellxpertLocalStorage()
  }

  return {
    cxd,
    cxAffId,
  }
}

/**
 * Sets the cellxpert localStorage item.
 *
 * Note: If you're affecting this function, please make sure to also affect the
 * function in the tracking pixel: `src/cx/p.js`
 */
const setCellxpertLocalStorage = (cxd: string, cxAffId: string) => {
  const cellxpert = {
    cxd,
    cxAffId,
    expiry: moment().add(30, 'days'),
  }

  setStorageItem('cellxpert', JSON.stringify(cellxpert))
  setCookieItem({ key: 'cellxpert', value: JSON.stringify(cellxpert) })

  return cellxpert
}

export const loadCellxpert = (
  cxd: string | null,
  cxAffId: string | null,
  ref: string | null,
): { cxd: string | undefined; cxAffId: string | undefined } => {
  // We don't want to have users be affiliated through Rooferrals and Roobet Affiliates
  if (ref) {
    removeStorageItem('cellxpert')
    removeCookieItem('cellxpert')
    return DEFAULT_CELLXPERT_VALUES
  }

  if (cxd && cxAffId) {
    return setCellxpertLocalStorage(cxd, cxAffId)
  }

  const cellxpertLocalStorageItem =
    getStorageItem('cellxpert') || getCookieItem('cellxpert')?.value

  if (typeof cellxpertLocalStorageItem === 'string') {
    return parseCellxpertLocalStorageItem(cellxpertLocalStorageItem)
  }

  return DEFAULT_CELLXPERT_VALUES
}
