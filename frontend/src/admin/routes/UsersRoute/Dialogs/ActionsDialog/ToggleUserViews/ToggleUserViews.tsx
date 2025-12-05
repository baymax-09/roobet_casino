import React from 'react'
import { Grid } from '@mui/material'
import { useImmer } from 'use-immer'

import { useConfirm, useToasts } from 'common/hooks'
import { type UserData } from 'admin/routes/UsersRoute/types'
import { isApiError } from 'common/util'

import { PossiblyPermissionedToggleGroup } from './PossiblyPermissionedToggle'
import { useUserToggles } from './useUserToggles'

import { useToggleUserViewsStyles } from './ToggleUserViews.styles'

interface ToggleUserViewsProps {
  userData: UserData
  updateUserData: (userData: UserData) => void
}

export const ToggleUserViews: React.FC<ToggleUserViewsProps> = ({
  userData,
  updateUserData,
}) => {
  const classes = useToggleUserViewsStyles()
  const confirm = useConfirm()
  const [busy, updateBusy] = useImmer({})
  const { toast } = useToasts()
  const Toggles = useUserToggles()

  const onChangeSetting = toggle => async event => {
    const checked = event.target.checked
    let params = {}

    if (toggle.confirmUpdate) {
      try {
        params = await toggle.confirmUpdate(confirm, checked)
      } catch (err) {
        return
      }
    }

    updateBusy(b => {
      b[toggle.key] = true
    })

    try {
      await toggle.update(userData, checked, params)
      updateUserData(toggle.onUpdate(checked, params))
    } catch (err) {
      const message = isApiError(err)
        ? err.response.data
        : `Unknown error: ${err}`

      toast.error(message)
    }

    updateBusy(b => {
      b[toggle.key] = false
    })
  }

  return (
    <Grid container className={classes.root}>
      {Toggles.map(group => {
        return (
          <PossiblyPermissionedToggleGroup
            key={group.group}
            groupLabel={group.group}
            readRule={group.readRule}
            toggles={group.toggles.map(toggle => ({
              ...toggle,
              id: toggle.key,
              label: toggle.name,
              disabled: busy[toggle.key],
              enabled: !!toggle.enabled(userData),
              onChange: onChangeSetting(toggle),
            }))}
          />
        )
      })}
    </Grid>
  )
}
