import React from 'react'
import {
  List,
  ListItemButton,
  ListItemText,
  type ListItemTextProps,
} from '@mui/material'

import { type ChatPopupState } from './ChatFooter'

import { styles, useChatPopupStyles } from './ChatPopup.styles'

export interface ChatPopupItems {
  name: string
  active: string
}

interface ChatPopupProps {
  items: ChatPopupItems[]
  onClick: (arg0: string) => void
  listItemTextProps?: ListItemTextProps
  chatPopupState: ChatPopupState
  setChatPopupState: React.Dispatch<React.SetStateAction<ChatPopupState>>
}

export const ChatPopup: React.FC<ChatPopupProps> = React.memo(
  ({
    items,
    onClick,
    listItemTextProps,
    chatPopupState,
    setChatPopupState,
  }) => {
    const classes = useChatPopupStyles()

    const { focusedElementIndex } = chatPopupState

    React.useEffect(() => {
      setChatPopupState({
        items,
        focusedElementIndex: items.length - 1 ?? 0,
      })
    }, [items, setChatPopupState])

    return (
      <List sx={styles.Popup}>
        {items.map((item, index) => (
          <ListItemButton
            key={item.name}
            sx={[index === focusedElementIndex && styles.Item_Selected]}
            dense
            onClick={() => onClick(item.name)}
          >
            <ListItemText
              className={classes.PopupListItem__text}
              secondary={item.active}
              {...listItemTextProps}
            >
              {item.name}
            </ListItemText>
          </ListItemButton>
        ))}
      </List>
    )
  },
)

ChatPopup.displayName = 'ChatPopup'
