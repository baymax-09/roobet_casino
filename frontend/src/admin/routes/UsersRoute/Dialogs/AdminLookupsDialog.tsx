import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  type DialogProps,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'

import { type LookupRecord, type Lookup } from 'common/types'

import { useAdminLookupsDialogStyles } from './AdminLookupsDialog.styles'

type AdminLookupsDialogProps = {
  adminLookups: LookupRecord[]
  onLookup: (lookup: Lookup) => void
  onClose: () => void
} & Omit<DialogProps, 'onClose'>

export const AdminLookupsDialog: React.FC<AdminLookupsDialogProps> = React.memo(
  ({ adminLookups, onLookup, ...dialogProps }) => {
    const classes = useAdminLookupsDialogStyles()

    return (
      <Dialog {...dialogProps}>
        <DialogTitle>Lookup History</DialogTitle>
        <List>
          {adminLookups.map(lookup => (
            <ListItem button onClick={() => onLookup(lookup)} key={lookup.key}>
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={lookup.key} secondary={lookup.id} />
            </ListItem>
          ))}
        </List>
        <DialogActions>
          <Button onClick={dialogProps.onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    )
  },
)
