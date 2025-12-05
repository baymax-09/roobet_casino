import { basicUserMock } from '../../../../../test/mocks/user'
import { handler } from '../../../../modules/fraud/riskAssessment/workers/riskJobs'
import * as riskNotifications from '../../../../modules/fraud/riskAssessment/workers/handleNotifications'
import * as fraudUtils from '../../../../modules/fraud/util'
import * as userDocument from '../../../../modules/user/documents/user'
import {
  type AppliedRulesType,
  RiskStatus,
  type SeonAppliedRule,
  type Action,
  type SeonResponseJob,
} from '../../../../vendors/seon/types'
import * as seonActions from '../../../../vendors/seon'
import { type User } from '../../../user/types'

function getSeonResponsePayload(
  status: RiskStatus,
  rules: SeonAppliedRule[],
  actionType?: Action,
  userId?: string,
  dataId?: string,
): SeonResponseJob {
  return {
    userId: userId ?? '123',
    actionType: actionType ?? 'user_signup',
    data: {
      id: dataId ?? '417B7jh3R',
      state: status,
      applied_rules: rules,
    },
  } as unknown as SeonResponseJob
}

function getSeonAppliedRule(
  id: AppliedRulesType,
  name: string,
  operation: string,
): SeonAppliedRule {
  return {
    id,
    name,
    operation,
    score: 0,
  }
}

function getMockUser(userAttribs: any): User {
  return {
    ...basicUserMock,
    kycRequiredLevel: 0,
    selectedBalanceType: 'eth',
    ...userAttribs,
  }
}

const cases = [
  {
    name: 'Non-declined TRX Are Unaffected',
    inputs: {
      userId: '123',
      actionType: 'user_signup' as Action,
      data: {
        id: '417B7jh3R',
        state: RiskStatus.APPROVED,
        applied_rules: [],
      },
    },
    outcomes: {
      resolves: true,
      notifications: true,
      rejectListOnDecline: false,
      allowanceListForRules: false,
    },
  },
  {
    name: 'Declined `user_signup` TRX List On Rules',
    inputs: {
      userId: '123',
      actionType: 'user_signup' as Action,
      data: {
        id: '417B7jh3R',
        state: RiskStatus.DECLINED,
        applied_rules: [],
      },
    },
    outcomes: {
      resolves: true,
      notifications: true,
      rejectListOnDecline: true,
      allowanceListForRules: true,
    },
  },
  {
    name: 'Declined TRX without Level 2 Rules or Bypass locks systems',
    user: {
      id: '123',
    },
    inputs: {
      userId: '123',
      actionType: 'cash_withdraw' as Action,
      data: {
        id: '417B7jh3R',
        state: RiskStatus.DECLINED,
        applied_rules: [
          getSeonAppliedRule(
            '1000496',
            'A Non-KYC Fraud Rule That Means Something',
            'APPROVE',
          ),
          getSeonAppliedRule(
            '1000496',
            'A Non-KYC Fraud Rule That Means Something Else',
            'DECLINE',
          ),
        ],
      },
    },
    outcomes: {
      resolves: true,
      lockDownUser: [
        '123',
        ['withdraw', 'deposit', 'tip'],
        'Seon - Declined Non-KYC Rule - Manual Lock Required',
      ],
      notifications: true,
      rejectListOnDecline: true,
      allowanceListForRules: false,
    },
  },
]

describe('src/modules/fraud/riskAssessment/workers/riskJobs', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest
      .spyOn(fraudUtils, 'lockDownUser')
      .mockImplementation(() => Promise.resolve())
    jest
      .spyOn(riskNotifications, 'handleNotifications')
      .mockImplementation(() => Promise.resolve())
    jest
      .spyOn(seonActions, 'handleRejectListOnDecline')
      .mockImplementation(() => Promise.resolve())
    jest
      .spyOn(seonActions, 'handleAllowanceListForRules')
      .mockImplementation(() => Promise.resolve())
  })

  describe('Verifies Seon Handler Expected Cases', () => {
    it.each(cases)('$name', async ({ user, inputs, outcomes }) => {
      jest
        .spyOn(userDocument, 'getUserById')
        .mockImplementation(() => Promise.resolve(getMockUser(user)))
      const {
        userId,
        actionType,
        data: { id, state, applied_rules },
      } = inputs
      const payload: SeonResponseJob = getSeonResponsePayload(
        state,
        applied_rules,
        actionType,
        userId,
        id,
      )

      if (outcomes.resolves) {
        await expect(handler(payload)).resolves.not.toThrow()
      } else {
        await expect(handler(payload)).rejects.toThrow()
      }

      if (outcomes.notifications) {
        expect(riskNotifications.handleNotifications).toHaveBeenCalled()
      } else {
        expect(riskNotifications.handleNotifications).toHaveBeenCalledTimes(0)
      }

      if (outcomes.rejectListOnDecline) {
        expect(seonActions.handleRejectListOnDecline).toHaveBeenCalled()
      } else {
        expect(seonActions.handleRejectListOnDecline).toHaveBeenCalledTimes(0)
      }

      if (outcomes.allowanceListForRules) {
        expect(seonActions.handleAllowanceListForRules).toHaveBeenCalled()
      } else {
        expect(seonActions.handleAllowanceListForRules).toHaveBeenCalledTimes(0)
      }

      if (outcomes.lockDownUser) {
        expect(fraudUtils.lockDownUser).toHaveBeenCalledWith(
          ...outcomes.lockDownUser,
        )
      } else {
        expect(fraudUtils.lockDownUser).toHaveBeenCalledTimes(0)
      }
    })
  })
})
