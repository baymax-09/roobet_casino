import React from 'react'

import {
  ActiveGames,
  Affiliate,
  BetsUserLayout,
  Bonus,
  ChatMessages,
  DailyStats,
  DepositAddresses,
  DepositBonus,
  Deposits,
  Kyc,
  Offers,
  Overview,
  Roowards,
  SamePasswords,
  TouchedIPs,
  TransactionUserLayout,
  UserNotes,
  Withdrawals,
  SameFingerprints,
  QuestsUserLayout,
  ProviderBonuses,
  GameHistoryLayout,
  BetActivityLayout,
} from 'admin/routes/UsersRoute/UserLayouts'

export const INDEX_TYPES = [
  {
    name: 'Username',
    key: 'nameLowercase',
  },
  {
    name: 'User Id',
    key: 'id',
  },
  {
    name: 'Email',
    key: 'email',
  },
  {
    name: 'Name',
    key: 'name',
  },
]

/**
 * Used for the user view selection dropdown
 */
const SELECTABLE_VIEWS = [
  {
    key: 'overview',
    name: 'Overview',
    render: ({
      user,
      activeSession,
      updateActiveSessionData,
      refreshSession,
    }) => (
      <Overview
        currentUser={user}
        userData={activeSession.data}
        updateUserData={updateActiveSessionData}
        refreshSession={refreshSession}
        overviewType="list"
      />
    ),
  },
  {
    key: 'overview json',
    name: 'Overview (JSON)',
    isAvailable: true,
    render: ({
      user,
      activeSession,
      updateActiveSessionData,
      refreshSession,
    }) => (
      <Overview
        currentUser={user}
        userData={activeSession.data}
        updateUserData={updateActiveSessionData}
        overviewType="json"
        refreshSession={refreshSession}
      />
    ),
  },
  {
    key: 'user notes',
    name: 'User Notes',
    mobileOnly: true,
    render: ({ user, activeSession }) => (
      <UserNotes loggedInUserId={user.id} userData={activeSession.data} />
    ),
  },
  {
    key: 'bets',
    name: 'Bets',
    render: ({ activeSession }) => (
      <BetsUserLayout userData={activeSession.data} />
    ),
  },
  {
    key: 'game history',
    name: 'Game History',
    render: ({ activeSession }) => (
      <GameHistoryLayout userData={activeSession.data} />
    ),
  },
  {
    key: 'active games',
    name: 'Active Games',
    render: ({ activeSession }) => (
      <ActiveGames userData={activeSession.data} />
    ),
  },
  {
    key: 'transactions',
    name: 'Transactions',
    isAvailable: true,
    render: ({ activeSession }) => (
      <TransactionUserLayout userData={activeSession.data} />
    ),
  },
  {
    key: 'deposits',
    name: 'Deposits',
    render: ({ activeSession }) => <Deposits userData={activeSession.data} />,
  },
  {
    key: 'withdrawals',
    name: 'Withdrawals',
    render: ({ activeSession }) => (
      <Withdrawals userData={activeSession.data} />
    ),
  },
  {
    key: 'deposit addresses',
    name: 'Deposit Addresses',
    isAvailable: true,
    render: ({ activeSession }) => (
      <DepositAddresses userData={activeSession.data} />
    ),
  },
  {
    key: 'chat messages',
    name: 'Chat Messages',
    render: ({ activeSession }) => (
      <ChatMessages userData={activeSession.data} />
    ),
  },
  {
    key: 'offers',
    name: 'Offers',
    render: ({ activeSession }) => <Offers userData={activeSession.data} />,
  },
  {
    key: 'touched ips',
    name: 'IP Addresses',
    isAvailable: true,
    render: ({ activeSession }) => <TouchedIPs userData={activeSession.data} />,
  },
  {
    key: 'same passwords',
    name: 'Same Passwords',
    render: ({ activeSession }) => (
      <SamePasswords userData={activeSession.data} />
    ),
  },
  {
    key: 'same fingerprints',
    name: 'Same Fingerprints',
    render: ({ activeSession }) => (
      <SameFingerprints userData={activeSession.data} />
    ),
  },
  {
    key: 'affiliate',
    name: 'Affiliate',
    render: ({ activeSession, refreshSession }) => (
      <Affiliate
        userData={activeSession.data}
        refreshSession={refreshSession}
      />
    ),
  },
  {
    key: 'bonus',
    name: 'Bonus Calculator',
    render: ({ activeSession }) => <Bonus userData={activeSession.data} />,
  },
  {
    key: 'roowards',
    name: 'Roowards',
    render: ({ user, activeSession, updateActiveSessionData }) => (
      <Roowards userData={activeSession.data} />
    ),
  },
  {
    key: 'deposit bonus',
    name: 'Deposit Bonus',
    render: ({ user, activeSession, updateActiveSessionData }) => (
      <DepositBonus
        updateUserData={updateActiveSessionData}
        userData={activeSession.data}
      />
    ),
  },
  {
    key: 'kyc',
    name: 'KYC',
    isAvailable: true,
    render: ({ activeSession }) => <Kyc userData={activeSession.data} />,
  },
  {
    key: 'daily stats',
    name: 'Daily Stats',
    render: ({ activeSession }) => <DailyStats userData={activeSession.data} />,
  },
  {
    key: 'quests',
    name: 'Quests',
    render: ({ activeSession }) => (
      <QuestsUserLayout userId={activeSession.data.user.id} />
    ),
  },
  {
    key: 'provider-bonuses',
    name: 'Provider Bonuses',
    render: ({ activeSession, refreshSession }) => (
      <ProviderBonuses userData={activeSession.data} reload={refreshSession} />
    ),
  },
  {
    key: 'bet activity',
    name: 'Bet Activity',
    render: ({ activeSession }) => (
      <BetActivityLayout userData={activeSession.data} />
    ),
  },
]

export const getSelectableViews = user =>
  SELECTABLE_VIEWS.sort((v1, v2) => v1.name.localeCompare(v2.name))
