import { type UserData } from 'admin/routes/UsersRoute/types'
import { api, createMoment } from 'common/util'

import {
  UserLockReasons,
  UserTransactionToggleReasons,
  handleToggleReasons,
} from './UserToggleReasons'

function updateSystemSetting(userId, systemName, bool, params = {}) {
  return api.get('/admin/user/changeSystemDisabledForUser', {
    params: {
      ...params,
      userId,
      systemName,
      bool: !bool,
    },
  })
}

interface Toggle {
  key: string
  name: string
  onUpdate: (checked: boolean, params?: Record<string, any>) => any
  enabled: (userData: UserData) => boolean
  update: (
    userData: UserData,
    value: boolean,
    params: Record<string, any>,
  ) => Promise<any>

  // optional
  className?: string
  readRule?: string
  writeRule?: string
  confirmUpdate?: (confirm: any, checked: boolean) => Promise<any>
}

interface ToggleGroup {
  key: string
  group: string
  readRule?: string
  toggles: Toggle[]
}
const Toggles: ToggleGroup[] = [
  {
    key: 'account',
    group: 'Account',
    toggles: [
      {
        key: 'lock',
        name: 'Lock Account',
        className: 'lockAccount',
        readRule: 'account:read_lock',
        writeRule: 'account:update_lock',
        enabled: ({ user }) =>
          !!user.lockedUntil && new Date(user.lockedUntil) > new Date(),
        update: ({ user }, userLocked, { time, ...params }) => {
          if (userLocked) {
            let parsedTime // time will be null if not supplied
            const data: Record<string, any> = {
              ...params,
              userId: user.id,
            }

            if (time) {
              // Material Pickers inputs do not accept ISO time as a value without some extra tinkering
              // instead we'll catch the value here if supplied and convert it
              parsedTime = time.toISOString()
              data.time = parsedTime
            }
            return api.post('admin/users/addLock', data)
          } else {
            return api.post('admin/users/removeLock', {
              userId: user.id,
              reason: params.reason,
            })
          }
        },
        confirmUpdate: (confirm, checked) => {
          if (checked) {
            return confirm({
              title: 'Lock User',
              message: 'Please enter a reason for locking the user.',
              inputs: [
                {
                  type: 'select',
                  key: 'reason',
                  name: 'Category',
                  options: UserLockReasons,
                },
                {
                  type: 'datepicker',
                  key: 'time',
                  name: 'Lockout Expiration',
                },
                {
                  type: 'text',
                  key: 'note',
                  name: 'Note',
                  required: false,
                },
              ],
            })
          } else {
            return confirm({
              title: 'Unlock User',
              message: 'Please enter a reason for unlocking the user',
              inputs: [
                {
                  type: 'text',
                  key: 'reason',
                  name: 'Reason',
                  required: false,
                },
              ],
            })
          }
        },
        onUpdate:
          (locked, params) =>
          ({ user }) => {
            if (locked) {
              if (params?.time) {
                user.lockedUntil = params.time.toISOString()
              } else {
                user.lockedUntil = '2070-01-01T01:00:00.000Z'
              }
            } else {
              user.lockedUntil = null
            }
          },
      },
      {
        key: 'howieDeal',
        name: 'Howie Deal',
        className: 'howieDeal',
        readRule: 'account:read_howie_deal',
        writeRule: 'account:update_howie_deal',
        enabled: ({ user }) => !!user.howieDeal,
        update: ({ user }, value, params) => {
          if (!params.percent) {
            return api.post('admin/user/endHowieDeal', {
              userId: user.id,
            })
          }

          return api.post('admin/user/createHowieDeal', {
            percent: parseInt(params.percent),
            userId: user.id,
          })
        },
        confirmUpdate: (confirm, checked) => {
          if (!checked) {
            return confirm({
              title: 'End Howie Deal',
              message:
                'Are you sure you want to end the Howie deal for this user?',
            })
          }

          return confirm({
            title: 'Create Howie Deal',
            message: 'Example: 10, 20, 30, etc',
            inputs: [
              {
                type: 'number',
                key: 'percent',
                name: 'Percentage',
              },
            ],
          })
        },
        onUpdate:
          checked =>
          ({ user }, params = {}) => {
            user.howieDeal = checked
              ? {
                  percent: false,
                  remaining: false,
                  total: false,
                }
              : null
          },
      },
      {
        key: 'stats',
        name: 'Stats',
        readRule: 'account:read_stats',
        writeRule: 'account:update_stats',
        enabled: ({ settings }) => !!settings.stats.enabled,
        update: ({ user }, value) =>
          // Requires account:update_transactions
          updateSystemSetting(user.id, 'stats', value),
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.stats.enabled = enabled
          },
      },
      {
        key: 'surveys',
        name: 'Surveys',
        readRule: 'account:read_surveys',
        writeRule: 'account:update_surveys',
        enabled: ({ settings }) => !!settings.surveys.enabled,
        update: ({ user }, value, params) =>
          // Requires account:update_transactions
          updateSystemSetting(user.id, 'surveys', value, params),
        confirmUpdate: confirm =>
          confirm({
            title: 'Update Reason',
            message: 'Please enter a reason for updating this field',
            inputs: [
              {
                type: 'text',
                key: 'reason',
                name: 'Reason',
              },
            ],
          }).then(({ reason }) => ({ reason })),
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.surveys.enabled = enabled
          },
      },
      {
        key: 'roowards',
        name: 'Roowards',
        readRule: 'roowards:read',
        writeRule: 'roowards:update',
        enabled: ({ user }) => !user.roowardsDisabled,
        update: ({ user }) => {
          return api.post('admin/user/toggleRoowards', {
            userId: user.id,
            roowardsDisabled: !user.roowardsDisabled,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.roowardsDisabled = !user.roowardsDisabled
          },
      },
      {
        key: 'promo',
        name: 'Promo Banned',
        readRule: 'account:read_promoBanned',
        writeRule: 'account:update_promoBanned',
        enabled: ({ user: { isPromoBanned } }) => !!isPromoBanned,
        confirmUpdate: confirm =>
          confirm({
            title: 'Promo Banned Toggle',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'text',
                key: 'reason',
                name: 'Reason',
              },
            ],
          }),
        update: ({ user }, _, params) => {
          // Requires account:update_promo_banned
          return api.post('admin/user/togglePromoBanned', {
            userId: user.id,
            isPromoBanned: !user.isPromoBanned,
            reason: params.reason,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.isPromoBanned = !user.isPromoBanned
          },
      },
      {
        key: 'disableBetGoal',
        name: 'Disable Bet Goal',
        readRule: 'account:read_disableBetGoal',
        writeRule: 'account:update_disableBetGoal',
        enabled: ({ settings }) => !!settings.overrideBetGoal.enabled,
        update: ({ user }, value, params) =>
          // Requires account:update_transactions
          updateSystemSetting(user.id, 'overrideBetGoal', value, params),
        confirmUpdate: confirm =>
          confirm({
            title: 'Update Reason',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'text',
                key: 'reason',
                name: 'Reason',
              },
            ],
          }).then(({ reason }) => ({ reason })),
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.overrideBetGoal.enabled = enabled
          },
      },
      {
        key: 'fasttrackEmails',
        name: 'Fasttrack Emails',
        readRule: 'account:read_fasttrackEmails',
        writeRule: 'account:update_fasttrackEmails',
        enabled: ({ consentBundle }) => !!consentBundle?.email,
        update: async ({ user }, checked, params) => {
          // Requires crm:update
          return await api.post('admin/user/updateConsent', {
            ...params,
            userId: user.id,
            updatePayload: { email: checked },
          })
        },
        onUpdate:
          () =>
          ({ consentBundle }) => {
            consentBundle.email = !consentBundle.email
          },
      },
    ],
  },
  {
    key: 'transactions',
    group: 'Transactions',
    readRule: 'account:update_transactions',
    toggles: [
      {
        key: 'deposits',
        name: 'Deposits',
        readRule: 'account:read_deposits',
        writeRule: 'account:update_deposits',
        enabled: ({ settings }) => !!settings.deposit.enabled,
        confirmUpdate: confirm => {
          return confirm({
            title: 'Deposit Toggle',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'select',
                key: 'reason',
                name: 'Reason',
                options: UserTransactionToggleReasons,
              },
              {
                type: 'text',
                key: 'other',
                name: 'Other Reason',
                required: false,
              },
            ],
          })
        },
        update: ({ user }, value, params) => {
          const reason = handleToggleReasons(params)
          if (!reason) {
            throw new Error('Please specify the reason if you selected Other')
          }
          params.reason = reason
          delete params.other
          return updateSystemSetting(user.id, 'deposit', value, params)
        },
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.deposit.enabled = enabled
          },
      },
      {
        key: 'cashOptions',
        name: 'Show Cash Wallet',
        readRule: 'account:read_cashOptions',
        writeRule: 'account:update_cashOptions',
        enabled: ({ settings }) => {
          return !!settings?.cashOptions?.enabled
        },
        update: ({ user }, value) => {
          // Requires account:update_transactions
          return updateSystemSetting(user.id, 'cashOptions', value)
        },
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.cashOptions.enabled = enabled
          },
      },
      {
        key: 'tips',
        name: 'Tips',
        readRule: 'account:read_tips',
        writeRule: 'account:update_tips',
        enabled: ({ settings }) => settings.tip.enabled,
        // Requires account:update_transactions
        confirmUpdate: confirm => {
          return confirm({
            title: 'Tips Toggle',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'select',
                key: 'reason',
                name: 'Reason',
                options: UserTransactionToggleReasons,
              },
              {
                type: 'text',
                key: 'other',
                name: 'Other Reason',
                required: false,
              },
            ],
          })
        },
        update: ({ user }, value, params) => {
          const reason = handleToggleReasons(params)
          if (!reason) {
            throw new Error('Please specify the reason if you selected Other')
          }
          params.reason = reason
          delete params.other
          return updateSystemSetting(user.id, 'tip', value, params)
        },
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.tip.enabled = enabled
          },
      },
      {
        key: 'bets',
        name: 'Bets',
        readRule: 'account:read_bets',
        writeRule: 'account:update_bets',
        enabled: ({ settings }) => settings.bets.enabled,
        confirmUpdate: confirm => {
          return confirm({
            title: 'Bets Toggle',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'select',
                key: 'reason',
                name: 'Reason',
                options: UserTransactionToggleReasons,
              },
              {
                type: 'text',
                key: 'other',
                name: 'Other Reason',
                required: false,
              },
            ],
          })
        },
        update: ({ user }, value, params) => {
          const reason = handleToggleReasons(params)
          if (!reason) {
            throw new Error('Please specify the reason if you selected Other')
          }
          params.reason = reason
          delete params.other
          return updateSystemSetting(user.id, 'bets', value, params)
        },
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.bets.enabled = enabled
          },
      },
      {
        key: 'withdrawals',
        name: 'Withdrawals',
        readRule: 'account:read_withdrawals',
        writeRule: 'account:update_withdrawals',
        enabled: ({ settings }) => settings.withdraw.enabled,
        confirmUpdate: confirm => {
          return confirm({
            title: 'Withdrawal Toggle',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'select',
                key: 'reason',
                name: 'Reason',
                options: UserTransactionToggleReasons,
              },
              {
                type: 'text',
                key: 'other',
                name: 'Other Reason',
                required: false,
              },
            ],
          })
        },
        update: ({ user }, value, params) => {
          const reason = handleToggleReasons(params)
          if (!reason) {
            throw new Error('Please specify the reason if you selected Other')
          }
          params.reason = reason
          delete params.other
          return updateSystemSetting(user.id, 'withdraw', value, params)
        },
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.withdraw.enabled = enabled
          },
      },
      {
        key: 'riskCheck',
        name: 'Risk Check',
        readRule: 'account:read_riskCheck',
        writeRule: 'account:update_riskCheck',
        enabled: ({ user }) => !user.bypassRiskCheck,
        confirmUpdate: (confirm, checked) =>
          confirm({
            title: 'Toggle Risk Check',
            message: 'Please enter a reason for changing this',
            inputs: [
              {
                type: 'text',
                key: 'reason',
                name: 'Reason',
              },
            ],
          }),
        // Requires account:update_risk_check
        update: ({ user }, mute, params) => {
          return api.post('admin/user/bypassRiskCheck', {
            userId: user.id,
            reason: params.reason,
            bypass: !user.bypassRiskCheck,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.bypassRiskCheck = !user.bypassRiskCheck
          },
      },
      {
        key: 'withdrawLimit',
        name: 'Withdraw Limit',
        readRule: 'account:read_withdrawalLimit',
        writeRule: 'account:update_withdrawalLimit',
        enabled: ({ user }) => {
          if (!user.dailyWithdrawLimit) return false
          else return user.dailyWithdrawLimit > 0
        },
        confirmUpdate: (confirm, checked) =>
          confirm({
            title: 'Daily Withdraw Limit',
            message:
              'Enter a new daily withdraw limit (0 for disabled). Withdraw limit will always be [Amount user has deposited today] + [Daily Withdraw Limit OR Default (200k)]',
            inputs: [
              {
                type: 'number',
                key: 'dailyWithdrawLimit',
                name: 'Daily Withdraw Limit',
              },
              {
                type: 'text',
                key: 'reason',
                name: 'Reason',
              },
            ],
          }),
        // Requires account:update_withdrawal_limit
        update: ({ user }, _, params) => {
          return api.post('admin/user/setDailyWithdrawLimit', {
            userId: user.id,
            reason: params.reason,
            dailyWithdrawLimit: parseFloat(params.dailyWithdrawLimit),
          })
        },
        onUpdate:
          (_, params) =>
          ({ user }) => {
            user.dailyWithdrawLimit = parseFloat(params?.dailyWithdrawLimit)
          },
      },
    ],
  },
  {
    key: 'chat',
    group: 'Chat',
    readRule: 'chat:update',
    toggles: [
      {
        key: 'muteChat',
        name: 'Chat Mute',
        enabled: ({ banStatus }) =>
          !!banStatus &&
          !!banStatus.muteTime &&
          banStatus.muteTime > createMoment().toISOString(),
        confirmUpdate: (confirm, checked) =>
          checked
            ? confirm({
                title: 'Mute Reason',
                message: 'Please enter a reason for chat muting this user',
                inputs: [
                  {
                    type: 'number',
                    key: 'minutes',
                    name: 'Minutes',
                    defaultValue: 5,
                  },
                  {
                    type: 'text',
                    key: 'reason',
                    name: 'Reason',
                  },
                ],
              })
            : Promise.resolve({}),
        // Requires isChatMod setting
        update: ({ user }, mute, params) => {
          return api.post(`/chat/${mute ? 'mute' : 'unMute'}`, {
            userId: user.id,
            reason: params.reason,
            seconds: parseInt(params.minutes) * 60,
          })
        },
        onUpdate:
          muted =>
          ({ banStatus }) => {
            if (muted) {
              banStatus.muteTime = createMoment()
                .add(1, 'd')
                .toDate()
                .toString()
            } else {
              banStatus.muteTime = null
            }
          },
      },
      {
        key: 'banChat',
        name: 'Chat Ban',
        enabled: ({ banStatus }) => !!banStatus && banStatus.chatBanned,
        confirmUpdate: (confirm, checked) =>
          checked
            ? confirm({
                title: 'Ban Reason',
                message: 'Please enter a reason for chat banning this user',
                inputs: [
                  {
                    type: 'text',
                    key: 'reason',
                    name: 'Reason',
                  },
                ],
              }).then(({ reason }) => ({ reason }))
            : Promise.resolve({}),
        // Requires isChatMod setting
        update: ({ user }, ban, params) => {
          return api.post(`chat/${ban ? 'ban' : 'unBan'}`, {
            ...params,
            userId: user.id,
          })
        },
        onUpdate:
          chatBanned =>
          ({ banStatus }) => {
            banStatus.chatBanned = chatBanned
          },
      },
      {
        key: 'modBadgeChat',
        name: 'Mod Badge',
        enabled: ({ user }) => !!user.hasChatModBadge,
        // Requires account:update_chat
        update: ({ user }) => {
          return api.post('admin/user/toggleChatModBadge', {
            userId: user.id,
            hasChatModBadge: !user.hasChatModBadge,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.hasChatModBadge = !user.hasChatModBadge
          },
      },
      {
        key: 'devBadgeChat',
        name: 'Dev Badge',
        enabled: ({ user }) => !!user.hasChatDevBadge,
        // Requires account:update_chat
        update: ({ user }) => {
          return api.post('admin/user/toggleChatDevBadge', {
            userId: user.id,
            hasChatDevBadge: !user.hasChatDevBadge,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.hasChatDevBadge = !user.hasChatDevBadge
          },
      },
      {
        key: 'chatMod',
        name: 'Chat Mod',
        enabled: ({ user }) => !!user.isChatMod,
        // Requires account:update_chat
        update: ({ user }) => {
          return api.post('admin/user/toggleChatModSetting', {
            userId: user.id,
            isChatMod: !user.isChatMod,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.isChatMod = !user.isChatMod
          },
      },
    ],
  },
  {
    key: 'role',
    group: 'Role',
    readRule: 'account:update_role',
    toggles: [
      {
        key: 'vip',
        name: 'VIP',
        enabled: ({ user }) => user.role === 'VIP',
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/assignRoleToAccount ', {
            userId: user.id,
            role: user.role === 'VIP' ? '' : 'VIP',
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.role = user.role === 'VIP' ? '' : 'VIP'
          },
      },
      {
        key: 'hv',
        name: 'High Value',
        enabled: ({ user }) => user.role === 'HV',
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/assignRoleToAccount ', {
            userId: user.id,
            role: user.role === 'HV' ? '' : 'HV',
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.role = user.role === 'HV' ? '' : 'HV'
          },
      },
      {
        key: 'cs',
        name: 'Customer Success',
        enabled: ({ user }) => user.role === 'CS',
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/assignRoleToAccount ', {
            userId: user.id,
            role: user.role === 'CS' ? '' : 'CS',
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.role = user.role === 'CS' ? '' : 'CS'
          },
      },
      {
        key: 'pl',
        name: 'Pre-Loyalty',
        enabled: ({ user }) => user.role === 'PL',
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/assignRoleToAccount ', {
            userId: user.id,
            role: user.role === 'PL' ? '' : 'PL',
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.role = user.role === 'PL' ? '' : 'PL'
          },
      },
      {
        key: 'pli',
        name: 'Pre-Loyalty Ineligible',
        enabled: ({ user }) => user.role === 'PLI',
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/assignRoleToAccount ', {
            userId: user.id,
            role: user.role === 'PLI' ? '' : 'PLI',
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.role = user.role === 'PLI' ? '' : 'PLI'
          },
      },
      {
        key: 'marketing',
        name: 'Marketing',
        enabled: ({ user }) => !!user.isMarketing,
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/toggleMarketing', {
            userId: user.id,
            isMarketing: !user.isMarketing,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.isMarketing = !user.isMarketing
          },
      },
      {
        key: 'influencer',
        name: 'Influencer',
        enabled: ({ user }) => !!user.isInfluencer,
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('crm/toggleInfluencer', {
            userId: user.id,
            isInfluencer: !user.isInfluencer,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.isInfluencer = !user.isInfluencer
          },
      },
      {
        key: 'sponsor',
        name: 'Sponsor',
        enabled: ({ user }) => !!user.isSponsor,
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/toggleSponsor', {
            userId: user.id,
            isSponsor: !user.isSponsor,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.isSponsor = !user.isSponsor
          },
      },
      {
        key: 'whale',
        name: 'Whale',
        enabled: ({ user }) => !!user.isWhale,
        // Requires account:update_role
        update: ({ user }) => {
          return api.post('admin/user/toggleWhale', {
            userId: user.id,
            isWhale: !user.isWhale,
          })
        },
        onUpdate:
          muted =>
          ({ user }) => {
            user.isWhale = !user.isWhale
          },
      },
    ],
  },
  {
    key: 'manager',
    group: 'Manager',
    readRule: 'account:update_manager',
    toggles: [
      'Katy',
      'Gustavo',
      'Barry',
      'Natalia',
      'Liviu',
      'Carlos',
      'Michael',
      'Alisa',
    ].map(manager => ({
      key: manager,
      name: manager,
      enabled: ({ user }) => user.manager === manager,
      // Requires account:update_manager
      update: ({ user }) => {
        return api.post('admin/user/assignManagerToAccount ', {
          userId: user.id,
          manager: user.manager === manager ? '' : manager,
        })
      },
      onUpdate:
        () =>
        ({ user }) => {
          user.manager = user.manager === manager ? '' : manager
        },
    })),
  },
  {
    key: 'department',
    group: 'Department',
    readRule: 'account:update_dept',
    toggles: [
      'Dev',
      'Marketing',
      'Risk',
      'Finance',
      'VIP',
      'Support',
      'Gaming',
    ].map(department => ({
      key: department,
      name: department,
      enabled: ({ user }) => user.department === department,
      // Requires account:update_dept
      update: ({ user }) => {
        return api.post('admin/user/assignDepartmentToAccount ', {
          userId: user.id,
          department: user.department === department ? '' : department,
        })
      },
      onUpdate:
        () =>
        ({ user }) => {
          user.department = user.department === department ? '' : department
        },
    })),
  },
  {
    key: 'product',
    group: 'Product',
    readRule: 'account:update_product',
    toggles: ['Sportsbook', 'Casino'].map(product => ({
      key: product,
      name: product,
      enabled: ({ user }) => user.product === product,
      // Requires account:update_product
      update: ({ user }) => {
        return api.post('admin/user/assignProductToAccount ', {
          userId: user.id,
          product: user.product === product ? '' : product,
        })
      },
      onUpdate:
        muted =>
        ({ user }) => {
          user.product = user.product === product ? '' : product
        },
    })),
  },
  {
    key: 'permissions',
    group: 'Permissions',
    readRule: 'account:update_permissions',
    toggles: [
      {
        key: 'staff',
        name: 'Staff Member',
        enabled: ({ user }) => !!user.staff,
        // Requires account:update_permissions
        update: ({ user }) => {
          return api.post('admin/user/toggleStaff', {
            userId: user.id,
            staff: !user.staff,
          })
        },
        onUpdate:
          () =>
          ({ user }) => {
            user.staff = !user.staff
          },
      },
    ],
  },
  {
    key: 'games',
    group: 'Games',
    readRule: 'account:update_lock',
    toggles: [
      {
        key: 'coinflip',
        name: 'Coinflip',
        enabled: ({ settings }) => !!settings.coinflip.enabled,
        update: ({ user }, value) =>
          // Requires account:update_transactions
          updateSystemSetting(user.id, 'coinflip', value),
        onUpdate:
          enabled =>
          ({ settings }) => {
            settings.coinflip.enabled = enabled
          },
      },
    ],
  },
]

export const useUserToggles = () => {
  return Toggles
}
