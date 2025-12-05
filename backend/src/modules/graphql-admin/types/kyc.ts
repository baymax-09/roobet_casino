import { objectType } from 'nexus'

const KycVerificationFailureType = objectType({
  name: 'KycVerificationFailure',
  sourceType: {
    module: __dirname,
    export: 'DBKycVerificationFailure',
  },
  definition(type) {
    type.nonNull.string('error')
    type.string('field')
  },
})

const KycVerificationLevelResultType = objectType({
  name: 'KycVerificationLevelResult',
  sourceType: {
    module: __dirname,
    export: 'DBKycVerificationLevelResult',
  },
  definition(type) {
    type.nonNull.boolean('verified')
    type.nonNull.int('level')
    type.list.nonNull.field('failures', {
      auth: null,
      type: KycVerificationFailureType,
    })
    type.boolean('reject')
  },
})

export const KYCRecordType = objectType({
  name: 'KYCRecord',
  sourceType: {
    module: __dirname,
    export: 'DBKYCRecord',
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.string('userId')
    type.string('firstName')
    type.string('lastName')
    type.string('phone')
    type.boolean('phoneVerified')
    type.string('dob')
    type.nonNull.string('sourceOfFunds')
    type.nonNull.string('legacyAddress')
    type.nonNull.string('legacyName')
    type.list.nonNull.field('validationResults', {
      auth: null,
      type: KycVerificationLevelResultType,
    })
    type.string('addressCity')
    type.string('addressCountry')
    type.string('addressLine1')
    type.string('addressLine2')
    type.string('addressPostalCode')
    type.string('addressState')
    type.boolean('rejected')
  },
})
