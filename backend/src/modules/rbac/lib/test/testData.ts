import { Types } from 'mongoose'

import { type JoinedRBACRole } from '../../documents/RBACRoles'
import { type RBACPolicy } from '../../documents/RBACPolicies'

export const testPolicies: Record<string, RBACPolicy> = {
  'Allow-All': {
    _id: new Types.ObjectId(),
    name: 'Allow All',
    slug: 'Allow-All',
    createdAt: new Date(),
    updatedAt: new Date(),
    effect: 'allow',
    rules: ['*:*'],
  },
  'Deny-All': {
    _id: new Types.ObjectId(),
    name: 'Deny All',
    slug: 'Deny-All',
    createdAt: new Date(),
    updatedAt: new Date(),
    effect: 'deny',
    rules: ['*:*'],
  },
  'Allow-All-Balances': {
    _id: new Types.ObjectId(),
    name: 'Allow All Balances',
    slug: 'Allow-All-Balances',
    createdAt: new Date(),
    updatedAt: new Date(),
    effect: 'allow',
    rules: ['balances:*'],
  },
  'Allow-Some-Content-And-Some-Chat': {
    _id: new Types.ObjectId(),
    name: 'Allow Some Content',
    slug: 'Allow-Some-Content',
    createdAt: new Date(),
    updatedAt: new Date(),
    effect: 'allow',
    rules: ['content:read', 'content:update', 'chat:read'],
  },
  'Allow-Some-Withdrawals-And-All-Slot-Potato': {
    _id: new Types.ObjectId(),
    name: 'Allow Some Withdrawals And All Slot Potato',
    slug: 'Allow-Some-Withdrawals-And-All-Slot-Potato',
    createdAt: new Date(),
    updatedAt: new Date(),
    effect: 'allow',
    rules: ['slot_potato:*', 'withdrawals:read'],
  },
  'Deny-Some-Balances-And-All-Chat': {
    _id: new Types.ObjectId(),
    name: 'Deny Some Balances And All Chat',
    slug: 'Deny-Some-Balances-And-All-Chat',
    createdAt: new Date(),
    updatedAt: new Date(),
    effect: 'deny',
    rules: ['balances:reset', 'chat:*'],
  },
}

export const testRoles: Record<string, JoinedRBACRole> = {
  'Super-Admin': {
    _id: new Types.ObjectId(),
    policies: [testPolicies['Allow-All']],
    name: 'Super Admin',
    slug: 'Super-Admin',
    userIds: [],
    policyIds: [testPolicies['Allow-All']._id],
  },
  'Unusable-Super-Admin': {
    _id: new Types.ObjectId(),
    policies: [testPolicies['Allow-All'], testPolicies['Deny-All']],
    name: 'Unusable Super Admin',
    slug: 'Unusable-Super-Admin',
    userIds: [],
    policyIds: [testPolicies['Allow-All']._id, testPolicies['Deny-All']._id],
  },
  'Basic-Staff': {
    _id: new Types.ObjectId(),
    policies: [
      testPolicies['Allow-All-Balances'],
      testPolicies['Allow-Some-Content-And-Some-Chat'],
    ],
    name: 'Basic Staff',
    slug: 'Basic-Staff',
    userIds: [],
    policyIds: [
      testPolicies['Allow-All-Balances']._id,
      testPolicies['Allow-Some-Content-And-Some-Chat']._id,
    ],
  },
  'Basic-Staff-Two': {
    _id: new Types.ObjectId(),
    policies: [
      testPolicies['Allow-All-Balances'],
      testPolicies['Allow-Some-Content-And-Some-Chat'],
      testPolicies['Deny-Some-Balances-And-All-Chat'],
    ],
    name: 'Basic Staff Two',
    slug: 'Basic-Staff-Two',
    userIds: [],
    policyIds: [
      testPolicies['Allow-All-Balances']._id,
      testPolicies['Allow-Some-Content-And-Some-Chat']._id,
      testPolicies['Deny-Some-Balances-And-All-Chat']._id,
    ],
  },
  'Basic-Staff-Three': {
    _id: new Types.ObjectId(),
    policies: [testPolicies['Allow-Some-Withdrawals-And-All-Slot-Potato']],
    name: 'Basic Staff Three',
    slug: 'Basic-Staff-Three',
    userIds: [],
    policyIds: [testPolicies['Allow-Some-Withdrawals-And-All-Slot-Potato']._id],
  },
}
