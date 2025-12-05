import gql from 'graphql-tag'

export interface UserSystemStatusQueryVars {
  systemName: string
}

export interface UserSystemStatusQueryData {
  userSystemStatus: null | {
    enabled: boolean
    requiredKycLevel?: number
  }
}

export const UserSystemStatusQuery = gql`
  query UserSystemStatus($systemName: String!) {
    userSystemStatus(systemName: $systemName) {
      enabled
      requiredKycLevel
    }
  }
`
