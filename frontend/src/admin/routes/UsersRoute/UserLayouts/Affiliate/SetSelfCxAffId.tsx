import React from 'react'
import { Button, TextField } from '@mui/material'

import { useAxiosPost, useConfirm, useToasts } from 'common/hooks'

import { useSetSelfCxAffIdStyles } from './SetSelfCxAffId.styles'

interface SetSelfCxAffIdProps {
  userId: string
  value?: string
  reload: () => void
}

export const SetSelfCxAffId: React.FC<SetSelfCxAffIdProps> = ({
  userId,
  value,
  reload,
}) => {
  const confirm = useConfirm()
  const classes = useSetSelfCxAffIdStyles()
  const { toast } = useToasts()

  const [cxAffId, setCxAffId] = React.useState<string>('')
  const [loading, setLoading] = React.useState<boolean>(false)

  const [setSelfCxAffId] = useAxiosPost('/crm/setSelfCxAffId', {
    onError: () => {
      toast.error("Failed to update affiliate's cxAffId")
    },
  })

  React.useEffect(() => {
    setCxAffId(value ?? '')
  }, [value])

  const save = React.useCallback(
    async (cxAffId: string | null) => {
      setLoading(true)

      // Post value to API.
      await setSelfCxAffId({
        variables: {
          userId,
          cxAffId,
        },
      })

      // Reload user data.
      await reload()

      setLoading(false)
    },
    [reload, userId, setSelfCxAffId],
  )

  const clear = React.useCallback(async () => {
    // Confirm the user wants to continue.
    try {
      await confirm({
        title: "Remove Affiliate's cxAffId",
        message:
          'Removing the cxAffId will enable on-site affiliate earnings for this user. Are you sure you want to continue?',
      })
    } catch {
      return
    }

    await save(null)

    toast.success("Removed affiliate's cxAffId.")
  }, [save, confirm, toast])

  const set = React.useCallback(
    async event => {
      event.preventDefault()

      // Confirm the user wants to continue.
      try {
        await confirm({
          title: "Set Affiliate's cxAffId",
          message:
            'Setting the cxAffId will disabled on-site affiliate earnings for this user. Are you sure you want to continue?',
        })
      } catch {
        return
      }

      await save(cxAffId)

      toast.success("Set affiliate's cxAffId.")
    },
    [cxAffId, confirm, save, toast],
  )

  return (
    <form onSubmit={set}>
      <div className={classes.formGroup}>
        <TextField
          variant="standard"
          required
          id="body"
          label="Affiliate's cxAffId"
          type="text"
          name="body"
          value={cxAffId}
          onChange={event => setCxAffId(event.target.value)}
          disabled={!!value || loading}
        />
        {value ? (
          <Button disabled={loading} onClick={clear} variant="contained">
            Remove
          </Button>
        ) : (
          <Button disabled={loading} type="submit" variant="contained">
            Set
          </Button>
        )}
      </div>
    </form>
  )
}
