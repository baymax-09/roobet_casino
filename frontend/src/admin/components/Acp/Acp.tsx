import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Collapse,
  ListItemText,
  IconButton,
  List,
  ListItem,
  Button,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Drawer from '@mui/material/Drawer'

import { useUser } from 'common/hooks'
import { useAccessControl } from 'admin/hooks'

import { DarkModeToggle } from '../DarkModeToggle'
import { CurrencyExchangeDialog } from '../Dialogs'

import { useAcpStyles } from './Acp.styles'

/**
 * @todo make a discriminated union, top level with items should not have show and children should not have items
 */
interface NavigationItem {
  key: string
  to: string
  name: string
  description?: string
  show?: boolean
  items?: NavigationItem[]
  open?: boolean
}

type AcpViewProps = React.PropsWithChildren<Record<never, never>>

/**
 * @todo fix opening sidebar to current page
 * @todo add active state to current navigation item
 */
const AcpView: React.FC<AcpViewProps> = ({ children }) => {
  const classes = useAcpStyles()
  const location = useLocation()
  const user = useUser()
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const { hasAccess: hasMessagingAccess } = useAccessControl(['messaging:read'])
  const { hasAccess: hasSettingsAccess } = useAccessControl(['settings:update'])
  const { hasAccess: hasUsersAccess } = useAccessControl(['account:read'])
  const { hasAccess: hasRafflesAccess } = useAccessControl([
    'raffles:create',
    'raffles:update',
  ])
  const { hasAccess: hasKYCAccess } = useAccessControl(['kyc:read'])
  const { hasAccess: hasPromoAccess } = useAccessControl(['promos:read'])
  const { hasAccess: hasPromoBulkAccess } = useAccessControl([
    'promos:create_bulk',
  ])
  const { hasAccess: hasLegalContentAccess } = useAccessControl(['legal:read'])
  const { hasAccess: hasSlotPotatoAccess } = useAccessControl([
    'slot_potato:read',
  ])
  const { hasAccess: hasIpLookupAccess } = useAccessControl(['iplookup:read'])
  const { hasAccess: hasSponsorsAccess } = useAccessControl(['sponsors:read'])
  const { hasAccess: hasReportsAccess } = useAccessControl(['reports:read'])
  const { hasAccess: hasKothAccess } = useAccessControl(['koth:update'])
  const { hasAccess: hasCallDevAccess } = useAccessControl(['calldev:create'])
  const { hasAccess: hasTPGameAccess } = useAccessControl(['tpgames:read'])
  const { hasAccess: hasTPGameBulkAccess } = useAccessControl([
    'tpgames:update_bulk',
  ])
  const { hasAccess: hasTPGameTagAccess } = useAccessControl([
    'tpgametags:read',
  ])
  const { hasAccess: hasTPGameDisablesAccess } = useAccessControl([
    'tpgame_disables:read',
  ])
  const { hasAccess: hasGlobalStatsAccess } = useAccessControl([
    'global_stats:read',
  ])
  const { hasAccess: hasInventoryAccess } = useAccessControl(['inventory:read'])
  const { hasAccess: hasUsersBulkUpdateAccess } = useAccessControl([
    'account:update_bulk',
  ])
  const { hasAccess: hasBulkBalanceAddVIPAccess } = useAccessControl([
    'balances:vip_bulk',
  ])
  const { hasAccess: hasBulkDepositBonusAccess } = useAccessControl([
    'deposit_bonus:create_bulk',
  ])
  const { hasAccess: hasBulkUserReportsAccess } = useAccessControl([
    'reports:create',
  ])
  const { hasAccess: hasCRMAccess } = useAccessControl(['crm:read'])
  const { hasAccess: hasDepositsAccess } = useAccessControl(['deposits:update'])
  const { hasAccess: hasDepositTransactionAccess } = useAccessControl([
    'deposits:dangerously_update',
  ])
  const { hasAccess: hasWithdrawalsAccess } = useAccessControl([
    'withdrawals:update',
  ])
  const { hasAccess: hasUserRolesAccess } = useAccessControl([
    'user_roles:update',
  ])
  const { hasAccess: hasAddyLookupAccess } = useAccessControl([
    'address_lookup:read',
  ])
  const { hasAccess: hasBulkUserNotesAccess } = useAccessControl([
    'user_notes:create_bulk',
  ])
  const { hasAccess: hasBulkFreespinAccess } = useAccessControl([
    'freespins:create_bulk',
  ])
  const { hasAccess: hasFlaggedWithdrawalsAccess } = useAccessControl([
    'withdrawals:read_flagged',
  ])

  // TODO get rid of nested lists
  const NavigationItems = React.useMemo(
    (): NavigationItem[][] => [
      [
        {
          key: 'dashboard',
          to: '/dashboard',
          name: 'Dashboard',
          show: hasGlobalStatsAccess,
        },
      ],
      [
        {
          key: 'users',
          to: '/users',
          name: 'Users',
          show: hasUsersAccess,
        },
      ],
      [
        {
          key: 'sponsors',
          to: '/sponsors',
          name: 'Sponsors',
          show: hasSponsorsAccess,
        },
      ],
      [
        {
          key: 'reports',
          to: '/reports',
          name: 'Reports',
          show: hasReportsAccess,
        },
      ],
      [
        {
          key: 'kyc',
          to: '/kyc',
          name: 'KYC',
          items: [
            {
              key: 'In Review',
              to: '/kyc/review',
              name: 'In Review',
              description: 'Users pending KYC review.',
              show: hasKYCAccess,
            },
            {
              key: 'User Lookup',
              to: '/kyc/user-lookup',
              name: 'User Lookup',
              description: 'Lookup by Document Reference.',
              show: hasKYCAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'crm',
          to: '/crm,',
          name: 'CRM',
          items: [
            {
              key: 'Bonus Code',
              to: '/crm/bonus-codes',
              name: 'Bonus Code',
              description: 'Alter the bonus codes for the Fast Track CRM.',
              show: hasCRMAccess,
            },
            {
              key: 'koth',
              to: '/crm/koths',
              name: 'KOTH',
              show: hasKothAccess,
            },
            {
              key: 'promos',
              to: '/crm/promos',
              name: 'Promos',
              show: hasPromoAccess,
            },
            {
              key: 'raffles',
              to: '/crm/raffles',
              name: 'Raffles',
              show: hasRafflesAccess,
            },
            {
              key: 'slot-potato',
              to: '/crm/slot-potato',
              name: 'Slot Potato',
              show: hasSlotPotatoAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'bulk',
          to: '/bulk',
          name: 'Bulk',
          // description: 'Manage User Promotions',
          items: [
            {
              key: 'bulk-balance-add',
              to: '/bulk/balance-add',
              name: 'Balance Add',
              description: 'Add user balances',
              show: hasBulkBalanceAddVIPAccess,
            },
            {
              key: 'prag-fs',
              to: '/bulk/prag-fs',
              name: 'Pragmatic FS',
              description: 'Add Pragmatic FS',
              show: hasBulkFreespinAccess,
            },
            {
              key: 'sws-fs',
              to: '/bulk/sws-fs',
              name: 'Softswiss FS',
              description: 'Add Softswiss FS',
              show: hasBulkFreespinAccess,
            },
            {
              key: 'hacksaw-fs',
              to: '/bulk/hacksaw-fs',
              name: 'Hacksaw FS',
              description: 'Add Hacksaw FS',
              show: hasBulkFreespinAccess,
            },
            {
              key: 'sportsbook-bonus',
              to: '/bulk/sportsbook-bonus',
              name: 'Sportsbook Bonus',
              description: 'Add Sportsbook Bonus',
              show: hasBulkFreespinAccess,
            },
            {
              key: 'slotegrator-fs',
              to: '/bulk/slotegrator-fs',
              name: 'Slotegrator FS',
              description: 'Add Slotegrator FS',
              show: hasBulkFreespinAccess,
            },
            {
              key: 'bulk-promos',
              to: '/bulk/promos',
              name: 'Promos',
              description: 'Add promo codes',
              show: hasPromoBulkAccess,
            },
            {
              key: 'bulk-notes',
              to: '/bulk/user-notes',
              name: 'User Notes',
              description: 'Bulk add user notes',
              show: hasBulkUserNotesAccess,
            },
            {
              key: 'bulk-user-update',
              to: '/bulk/user-update',
              name: 'User Update',
              description: 'Bulk user update',
              show: hasUsersBulkUpdateAccess,
            },
            {
              key: 'bulk-user-reports',
              to: '/bulk/user-reports',
              name: 'User Reports',
              description: 'Bulk user report',
              show: hasBulkUserReportsAccess,
            },
            {
              key: 'bulk-deposit-bonus',
              to: '/bulk/deposit-bonus',
              name: 'Deposit Bonus',
              description: 'Bulk deposit bonus',
              show: hasBulkDepositBonusAccess,
            },
            {
              key: 'bulk-game-images',
              to: '/bulk/game-images',
              name: 'Game Images',
              description: 'Bulk game image updates',
              show: hasTPGameBulkAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'controls',
          to: '/controls',
          name: 'Controls',
          items: [
            {
              key: 'eth',
              to: '/controls/eth',
              name: 'ETH',
              description: 'Ethereum Controls',
              show:
                hasDepositsAccess ||
                hasWithdrawalsAccess ||
                hasDepositTransactionAccess,
            },
            {
              key: 'btc',
              to: '/controls/btc',
              name: 'BTC',
              description: 'Bitcoin Controls',
              show:
                hasDepositsAccess ||
                hasWithdrawalsAccess ||
                hasDepositTransactionAccess,
            },
            {
              key: 'ltc',
              to: '/controls/ltc',
              name: 'LTC',
              description: 'Litecoin Controls',
              show:
                hasDepositsAccess ||
                hasWithdrawalsAccess ||
                hasDepositTransactionAccess,
            },
            {
              key: 'xrp',
              to: '/controls/xrp',
              name: 'XRP',
              description: 'Ripple Controls',
              show:
                hasDepositsAccess ||
                hasWithdrawalsAccess ||
                hasDepositTransactionAccess,
            },
            {
              key: 'tron',
              to: '/controls/tron',
              name: 'TRON',
              description: 'Tron Controls',
              show:
                hasDepositsAccess ||
                hasWithdrawalsAccess ||
                hasDepositTransactionAccess,
            },
            {
              key: 'doge',
              to: '/controls/doge',
              name: 'DOGE',
              description: 'Dogecoin Controls',
              show:
                hasDepositsAccess ||
                hasWithdrawalsAccess ||
                hasDepositTransactionAccess,
            },
            {
              key: 'iplookup',
              to: '/controls/iplookup',
              name: 'IP Lookup',
              show: hasIpLookupAccess,
            },
            {
              key: 'addyLookup',
              to: '/controls/addy-lookup',
              name: 'Addy Lookup',
              description: 'Lookup BTC or ETH addresses',
              show: hasAddyLookupAccess,
            },
            {
              key: 'userRoles',
              to: '/controls/user-roles',
              name: 'User Roles',
              show: hasUserRolesAccess,
            },
            {
              key: 'flaggedWithdrawals',
              to: '/controls/withdrawals/flagged',
              name: 'Flagged Withdrawals',
              show: hasFlaggedWithdrawalsAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'games',
          to: '/games',
          name: 'Games',
          items: [
            {
              key: 'games-manager',
              to: '/games/games-manager',
              name: 'Games Manager',
              description: 'Manages Games',
              // TODO update access when Categories are completed, currently only games/tags are functional
              show: hasTPGameAccess || hasTPGameTagAccess,
            },
            {
              key: 'tpgames-disabled',
              to: '/games/tp-group-disables',
              name: 'Group Disables',
              description: 'Group Disables',
              show: hasTPGameDisablesAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'content',
          to: '/content',
          name: 'Content',
          items: [
            {
              key: 'legal',
              to: '/content/legal',
              name: 'Legal Copy',
              show: hasLegalContentAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'messaging',
          to: '/messaging',
          name: 'Messaging',
          items: [
            {
              key: 'messagingMessages',
              to: '/messaging/mailbox',
              name: 'Messages',
              show: hasMessagingAccess,
            },
            {
              key: 'messagingTemplates',
              to: '/messaging/templates',
              name: 'Templates',
              show: hasMessagingAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'inventory',
          to: '/inventory',
          name: 'Inventory',
          items: [
            {
              key: 'houseInventory',
              to: '/inventory/house-inventory',
              name: 'House Inventory',
              show: hasInventoryAccess,
            },
            {
              key: 'rewardsInventory',
              to: '/inventory/rewards-inventory',
              name: 'Rewards Inventory',
              show: hasInventoryAccess,
            },
            {
              key: 'questTemplates',
              to: '/inventory/quest-templates',
              name: 'Quest Templates',
              show: hasInventoryAccess,
            },
          ],
        },
      ],
      [
        {
          key: 'settings',
          to: '/settings',
          name: 'Settings',
          show: hasSettingsAccess,
        },
      ],
    ],
    [
      hasSlotPotatoAccess,
      hasKYCAccess,
      hasPromoAccess,
      hasPromoBulkAccess,
      hasLegalContentAccess,
      hasIpLookupAccess,
      hasSponsorsAccess,
      hasReportsAccess,
      hasKothAccess,
      hasAddyLookupAccess,
      hasCallDevAccess,
      hasTPGameAccess,
      hasTPGameBulkAccess,
      hasTPGameTagAccess,
      hasTPGameDisablesAccess,
      hasGlobalStatsAccess,
      hasBulkUserNotesAccess,
      hasInventoryAccess,
      hasBulkBalanceAddVIPAccess,
      hasBulkDepositBonusAccess,
      hasCRMAccess,
      hasDepositsAccess,
      hasWithdrawalsAccess,
      hasBulkFreespinAccess,
      hasBulkUserReportsAccess,
      hasDepositTransactionAccess,
      hasMessagingAccess,
      hasRafflesAccess,
      hasSettingsAccess,
      hasUserRolesAccess,
      hasUsersAccess,
      hasUsersBulkUpdateAccess,
      hasFlaggedWithdrawalsAccess,
    ],
  )

  const [openedMenus, updateOpenedMenus] = React.useState(() => {
    return NavigationItems.reduce((state, items) => {
      for (const item of items) {
        if (!!item.items && item.open) {
          state[item.key] = true
        } else {
          state[item.key] = false
        }
      }

      return state
    }, {})
  })

  // Open menu on page load.
  React.useEffect(() => {
    const topPath = location.pathname.split('/')[1]
    const topMenu = NavigationItems.find(([{ to }]) => to === `/${topPath}`)

    if (topMenu && topMenu[0].items) {
      updateOpenedMenus(prev => ({
        ...prev,
        [topMenu[0].key]: true,
      }))
    }
  }, [NavigationItems, location.pathname])

  const onMenuClick = (event, item) => {
    if (item.items) {
      event.preventDefault()
      updateOpenedMenus(openedMenus => ({
        ...openedMenus,
        [item.key]: !openedMenus[item.key],
      }))
    } else {
      setDrawerOpen(false)
    }
  }

  const onSubMenuClick = () => {
    setDrawerOpen(false)
  }

  // Navigation code here so we can duplicate for mobile
  const renderedNavigationItems = NavigationItems.map((items, index) => (
    <List key={index} disablePadding>
      {items.map(item => {
        const hasItems = !!item.items
        const isOpen = hasItems && openedMenus[item.key]

        // if any child has show: true, then show top-level
        if (item.items) {
          if (!item.items?.some(({ show }) => show === true)) {
            return null
          }
          // inverse logic to hide by default
        } else if (item.show !== true) {
          return null
        }

        return (
          <React.Fragment key={item.key}>
            <ListItem
              component={NavLink}
              button={hasItems}
              to={item.to}
              onClick={event => onMenuClick(event, item)}
              className={classes.navigationItem}
              divider
            >
              <ListItemText
                classes={{
                  primary: classes.navigationItemTextPrimary,
                }}
                primaryTypographyProps={{
                  variant: 'body2',
                }}
                primary={item.name}
              />

              {hasItems && (isOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItem>
            {hasItems && (
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List
                  className={classes.subItems}
                  component="div"
                  disablePadding
                >
                  {item.items?.map(subItem => {
                    // Inverse logic to hide by default
                    if (subItem.show !== true) {
                      return null
                    }

                    return (
                      <ListItem
                        key={subItem.key}
                        to={subItem.to}
                        component={NavLink}
                        onClick={onSubMenuClick}
                        className={classes.navigationItem}
                      >
                        <ListItemText
                          classes={{
                            primary: classes.navigationItemTextPrimary,
                          }}
                          primaryTypographyProps={{
                            variant: 'body2',
                          }}
                          primary={subItem.name}
                        />
                      </ListItem>
                    )
                  })}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        )
      })}
    </List>
  ))

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        {/* a horizontal container for the menu button on mobile */}
        <div className={classes.mobileMenuButtonContainer}>
          <IconButton onClick={() => setDrawerOpen(true)} size="large">
            <MenuIcon fontSize="small" className={classes.menuIcon} />
          </IconButton>
        </div>

        <div className={classes.navigation}>
          <div className={classes.currentUsername}>{user?.name}</div>
          <div className={classes.navigationMenus}>
            {renderedNavigationItems}
          </div>
          <Button
            disableRipple
            onClick={() => setDialogOpen(true)}
            className={classes.navigationItem}
          >
            Currency Exchange
          </Button>
          <DarkModeToggle textVariant="h4" />
        </div>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ className: classes.navigationDrawer }}
        >
          <div className={classes.currentUsername}>{user?.name}</div>
          {renderedNavigationItems}
          <DarkModeToggle textVariant="h6" />
        </Drawer>
        {dialogOpen && (
          <CurrencyExchangeDialog open={dialogOpen} setOpen={setDialogOpen} />
        )}
        <div className={classes.content}>{children}</div>
      </div>
    </div>
  )
}

export const Acp = React.memo(AcpView)
