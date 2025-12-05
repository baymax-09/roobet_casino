import { ApolloProvider } from '@apollo/client'
import { CssBaseline, ThemeProvider, StyledEngineProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { SnackbarProvider } from 'notistack'
import React from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Redirect, Route, Router, Switch } from 'react-router-dom'
import { theme as uiTheme } from '@project-atl/ui'
import { Check2, Close3, Info2, Warning } from '@project-atl/ui/assets'

import { getAdminApolloClient } from 'admin/gql'
import {
  ConfirmDialogProvider,
  CustomSnackbarContent,
  ToastCloseIcon,
} from 'common/components'
import { UserProvider } from 'common/components/UserProvider'
import { type User } from 'common/types'

import { Acp } from './components'
import { ThemeContextConsumer, ThemeContextProvider } from './context'
import { history } from './history'
import {
  AddyLookupRoute,
  BonusCodesPutRoute,
  BonusCodesRoute,
  BtcRoute,
  BulkBalanceAddRoute,
  BulkDepositBonusRoute,
  BulkGameImages,
  BulkHacksawFreespinsRoute,
  BulkNotesRoute,
  BulkPragmaticFreespinsRoute,
  BulkPromosRoute,
  BulkSportsbookBonusesRoute,
  BulkSoftswissFreespinsRoute,
  BulkUserReportRoute,
  BulkUserUpdateRoute,
  CreateKOTHRoute,
  CreatePromoRoute,
  CreateRaffleRoute,
  CreateSlotPotatoRoute,
  DashboardRoute,
  EditKOTHRoute,
  EditRaffleRoute,
  EditSlotPotatoRoute,
  EthRoute,
  XrpRoute,
  TronRoute,
  DOGERoute,
  LTCRoute,
  GameTagsCreateRoute,
  GameTagsRoute,
  GameTagsUpdateRoute,
  HouseInventoryRoute,
  IPLookupRoute,
  KYCInReviewRoute,
  KYCUserLookup,
  LegalCopyRoute,
  ListKOTHsRoute,
  ListPromoRoute,
  ListRafflesRoute,
  ListSlotPotatoRoute,
  MessageCreate,
  MessageList,
  MessageSend,
  MessageTemplateCreate,
  MessageTemplateList,
  MessageTemplateUpdate,
  MessageUpdate,
  PolicyPutRoute,
  QuestTemplatesRoute,
  ReportsRoute,
  RewardsInventoryRoute,
  RolePutRoute,
  RoowardsReloadRoute,
  SettingsRoute,
  SponsorsRoute,
  TPGameBlocksRoute,
  UserPoliciesList,
  UserRolesList,
  UserRolesUserList,
  UsersRoute,
  FlaggedWithdrawalsList,
  GamesManagerRoute,
  BulkSlotegratorFreespinsRoute,
} from './routes'
import { darkTheme, lightTheme } from './theme'

export const AdminProviders: React.FC<{ user: User }> = ({ user }) => {
  const snackbarRef = React.useRef<SnackbarProvider | null>(null)

  if (!user.staff) {
    return null
  }

  return (
    <ThemeContextProvider>
      <ThemeContextConsumer>
        {themeContext => (
          <StyledEngineProvider injectFirst>
            <ThemeProvider
              theme={themeContext?.darkMode ? darkTheme : lightTheme}
            >
              <CssBaseline />
              <HelmetProvider>
                <Helmet
                  defaultTitle="Roobet ACP"
                  titleTemplate="%s - Roobet ACP"
                />
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <ConfirmDialogProvider
                    theme={themeContext?.darkMode ? darkTheme : lightTheme}
                  >
                    <SnackbarProvider
                      ref={snackbarRef}
                      action={snackbarId => (
                        <ToastCloseIcon
                          snackbarKey={snackbarId}
                          variant="default"
                        />
                      )}
                      iconVariant={{
                        success: <Check2 />,
                        error: <Close3 />,
                        warning: (
                          <Warning iconFill={uiTheme.palette.neutral[900]} />
                        ),
                        info: <Info2 />,
                      }}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      Components={{
                        error: CustomSnackbarContent,
                        success: CustomSnackbarContent,
                        info: CustomSnackbarContent,
                        warning: CustomSnackbarContent,
                      }}
                    >
                      <UserProvider defaultUser={user}>
                        <ApolloProvider client={getAdminApolloClient(user)}>
                          <Router history={history}>
                            <Acp>
                              <Switch>
                                <Route
                                  path="/dashboard"
                                  component={DashboardRoute}
                                  exact
                                />
                                <Route
                                  path="/kyc/review"
                                  component={KYCInReviewRoute}
                                  exact
                                />
                                <Route
                                  path="/kyc/user-lookup"
                                  component={KYCUserLookup}
                                  exact
                                />
                                <Route
                                  path="/crm/bonus-codes"
                                  component={BonusCodesRoute}
                                  exact
                                />
                                <Route
                                  path="/crm/bonus-codes/create"
                                  component={BonusCodesPutRoute}
                                  exact
                                />
                                <Route
                                  path="/crm/bonus-codes/:id/edit"
                                  component={BonusCodesPutRoute}
                                  exact
                                />
                                <Route
                                  path="/users"
                                  component={UsersRoute}
                                  exact
                                />
                                <Route
                                  path="/sponsors"
                                  component={SponsorsRoute}
                                  exact
                                />
                                <Route
                                  path="/roowards/reload"
                                  component={RoowardsReloadRoute}
                                  exact
                                />
                                <Route
                                  path="/bulk/balance-add"
                                  component={BulkBalanceAddRoute}
                                />
                                <Route
                                  path="/bulk/promos"
                                  component={BulkPromosRoute}
                                />
                                <Route
                                  path="/bulk/user-notes"
                                  component={BulkNotesRoute}
                                />
                                <Route
                                  path="/bulk/user-update"
                                  component={BulkUserUpdateRoute}
                                />
                                <Route
                                  path="/bulk/prag-fs"
                                  component={BulkPragmaticFreespinsRoute}
                                />
                                <Route
                                  path="/bulk/hacksaw-fs"
                                  component={BulkHacksawFreespinsRoute}
                                />
                                <Route
                                  path="/bulk/sws-fs"
                                  component={BulkSoftswissFreespinsRoute}
                                />
                                <Route
                                  path="/bulk/sportsbook-bonus"
                                  component={BulkSportsbookBonusesRoute}
                                />
                                <Route
                                  path="/bulk/slotegrator-fs"
                                  component={BulkSlotegratorFreespinsRoute}
                                />
                                <Route
                                  path="/bulk/user-reports"
                                  component={BulkUserReportRoute}
                                />
                                <Route
                                  path="/bulk/deposit-bonus"
                                  component={BulkDepositBonusRoute}
                                />
                                <Route
                                  path="/bulk/game-images"
                                  component={BulkGameImages}
                                />
                                <Route
                                  path="/controls/btc"
                                  component={BtcRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/eth"
                                  component={EthRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/ltc"
                                  component={LTCRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/xrp"
                                  component={XrpRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/tron"
                                  component={TronRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/doge"
                                  component={DOGERoute}
                                  exact
                                />
                                <Route
                                  path="/content/legal"
                                  component={LegalCopyRoute}
                                  exact
                                />
                                <Route
                                  path="/crm/koths"
                                  component={ListKOTHsRoute}
                                  exact
                                />
                                <Route
                                  path="/crm/koths/:id/edit"
                                  component={EditKOTHRoute}
                                  exact
                                />
                                <Route
                                  path="/crm/koths/create"
                                  component={CreateKOTHRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/addy-lookup"
                                  component={AddyLookupRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/iplookup"
                                  component={IPLookupRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles"
                                  component={UserRolesList}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/policy"
                                  component={UserPoliciesList}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/policy/create"
                                  component={PolicyPutRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/policy/:id"
                                  component={PolicyPutRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/role"
                                  component={UserRolesList}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/role/create"
                                  component={RolePutRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/role/:id"
                                  component={RolePutRoute}
                                  exact
                                />
                                <Route
                                  path="/controls/user-roles/users"
                                  component={UserRolesUserList}
                                  exact
                                />
                                <Route
                                  path="/controls/withdrawals/flagged"
                                  component={FlaggedWithdrawalsList}
                                  exact
                                />
                                <Route
                                  path="/games/game-tags"
                                  component={GameTagsRoute}
                                  exact
                                />
                                <Route
                                  path="/games/game-tags/create"
                                  component={GameTagsCreateRoute}
                                  exact
                                />
                                <Route
                                  path="/games/game-tags/:id/edit"
                                  component={GameTagsUpdateRoute}
                                  exact
                                />
                                <Route
                                  path="/games/tp-group-disables"
                                  component={TPGameBlocksRoute}
                                  exact
                                />
                                <Route
                                  path="/games/games-manager"
                                  component={GamesManagerRoute}
                                  exact
                                />
                                <Route
                                  path="/inventory/house-inventory"
                                  component={HouseInventoryRoute}
                                  exact
                                />
                                <Route
                                  path="/inventory/rewards-inventory"
                                  component={RewardsInventoryRoute}
                                  exact
                                />
                                <Route
                                  path="/inventory/quest-templates"
                                  component={QuestTemplatesRoute}
                                  exact
                                />
                                <Route
                                  path="/crm/promos"
                                  exact
                                  component={ListPromoRoute}
                                />
                                <Route
                                  path="/crm/promos/create"
                                  exact
                                  component={CreatePromoRoute}
                                />
                                <Route
                                  path="/crm/raffles"
                                  exact
                                  component={ListRafflesRoute}
                                />
                                <Route
                                  path="/crm/raffles/create"
                                  exact
                                  component={CreateRaffleRoute}
                                />
                                <Route
                                  path="/crm/raffles/:id/edit"
                                  exact
                                  component={EditRaffleRoute}
                                />
                                <Route
                                  path="/reports"
                                  exact
                                  component={ReportsRoute}
                                />
                                <Route
                                  path="/settings"
                                  exact
                                  component={SettingsRoute}
                                />
                                <Route
                                  path="/messaging/templates"
                                  exact
                                  component={MessageTemplateList}
                                />
                                <Route
                                  path="/messaging/templates/create"
                                  exact
                                  component={MessageTemplateCreate}
                                />
                                <Route
                                  path="/messaging/templates/:id/edit"
                                  exact
                                  component={MessageTemplateUpdate}
                                />
                                <Route
                                  path="/messaging/mailbox"
                                  exact
                                  component={MessageList}
                                />
                                <Route
                                  path="/messaging/mailbox/create"
                                  exact
                                  component={MessageCreate}
                                />
                                <Route
                                  path="/messaging/mailbox/:id/send"
                                  exact
                                  component={MessageSend}
                                />
                                <Route
                                  path="/messaging/mailbox/:id/edit"
                                  exact
                                  component={MessageUpdate}
                                />
                                <Route
                                  path="/crm/slot-potato"
                                  exact
                                  component={ListSlotPotatoRoute}
                                />
                                <Route
                                  path="/crm/slot-potato/create"
                                  exact
                                  component={CreateSlotPotatoRoute}
                                />
                                <Route
                                  path="/crm/slot-potato/:id/edit"
                                  exact
                                  component={EditSlotPotatoRoute}
                                />
                                <Redirect from="/" exact to="/users" />
                              </Switch>
                            </Acp>
                          </Router>
                        </ApolloProvider>
                      </UserProvider>
                    </SnackbarProvider>
                  </ConfirmDialogProvider>
                </LocalizationProvider>
              </HelmetProvider>
            </ThemeProvider>
          </StyledEngineProvider>
        )}
      </ThemeContextConsumer>
    </ThemeContextProvider>
  )
}
