import React from 'react'
import {
  usePopupState,
  bindHover,
  bindPopper,
} from 'material-ui-popup-state/hooks'
import {
  IconButton,
  IconMenuList,
  type IconMenuListItem,
  Popper,
  type IconButtonProps,
  theme as uiTheme,
} from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

interface HoverIconButtonProps extends IconButtonProps {
  popupId: string
  items: IconMenuListItem[]
  active?: boolean
}

interface StyleProps {
  localeSelector: boolean
}

const getBackgroundColor = (
  active: boolean,
  localeSelector: boolean,
  hover: boolean,
) => {
  if (active) {
    return `${uiTheme.palette.primary[500]} !important`
  }
  if (localeSelector) {
    return hover
      ? `${uiTheme.palette.neutral[600]} !important`
      : `${uiTheme.palette.neutral[700]} !important`
  }
  return hover
    ? `${uiTheme.palette.neutral[500]} !important`
    : `${uiTheme.palette.neutral[600]} !important`
}

const iconButtonStyles = (
  active: boolean,
  localeSelector: boolean,
  popoverIsOpen: boolean,
) => ({
  position: 'relative',
  display: 'flex',
  backgroundColor: active
    ? `${uiTheme.palette.primary[500]} !important`
    : localeSelector
      ? `${uiTheme.palette.neutral[700]} !important`
      : `${uiTheme.palette.neutral[600]} !important`,

  // The button extension
  '&::after': {
    content: '" "',
    position: 'absolute',
    top: 0,
    right: -12,
    width: '47px',
    height: '100%',
    backgroundColor: popoverIsOpen
      ? getBackgroundColor(active, localeSelector, false)
      : 'transparent',
    zIndex: uiTheme.zIndex.drawer + 1,
    borderTopLeftRadius: 'inherit',
    borderBottomLeftRadius: 'inherit',
  },

  // So the button extension does not go over the Icon Button's icon
  '& > div > svg': {
    zIndex: uiTheme.zIndex.drawer + 2,
  },

  ...(popoverIsOpen && {
    backgroundColor: getBackgroundColor(active, localeSelector, false),
    transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',

    // Targeting the button extension
    '&:hover::after': {
      backgroundColor: getBackgroundColor(active, localeSelector, false),
      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
    },

    '&:hover': {
      backgroundColor: getBackgroundColor(active, localeSelector, true),

      // Targeting the button extension
      '&::after': {
        backgroundColor: getBackgroundColor(active, localeSelector, true),
        transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      },
    },
  }),
})

export const useHoverIconButtonClasses = makeStyles(() =>
  createStyles({
    Popper: {
      borderTopLeftRadius: 0,
      zIndex: 10000,
    },

    IconMenuList: ({ localeSelector }: StyleProps) => ({
      minWidth: 188,
      borderTopLeftRadius: `0px !important`,
      ...(localeSelector && { maxHeight: 250 }),
    }),
  }),
)

export const HoverIconButton: React.FC<HoverIconButtonProps> = ({
  popupId,
  items,
  active = false,
  ...iconButtonProps
}) => {
  const localeSelector = popupId === 'localizationPopup'
  const popupState = usePopupState({ variant: 'popover', popupId })
  const popoverIsOpen = popupState.isOpen

  const classes = useHoverIconButtonClasses({
    localeSelector,
  })

  return (
    <>
      <div {...bindHover(popupState)}>
        <IconButton
          {...iconButtonProps}
          // Keep styling inline. Weird behavior when trying to use className + mui makeStyles.
          sx={iconButtonStyles(active, localeSelector, popoverIsOpen)}
          size="medium"
        >
          {iconButtonProps.children}
        </IconButton>
      </div>
      <Popper
        className={classes.Popper}
        {...bindPopper(popupState)}
        placement="right-start"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8], // 8px to the right to account for button extension
            },
          },
        ]}
      >
        <IconMenuList
          items={items}
          iconMenuListProps={{
            className: classes.IconMenuList,
          }}
        />
      </Popper>
    </>
  )
}
