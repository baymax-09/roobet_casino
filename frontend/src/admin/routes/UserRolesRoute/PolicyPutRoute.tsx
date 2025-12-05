import React from 'react'
import { useHistory } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'

import { Loading } from 'mrooi'
import { useToasts } from 'common/hooks'
import {
  PoliciesQuery,
  type PolicyQueryResult,
  RbacPolicyCreateMutation,
  RbacPolicyUpdateMutation,
  type PolicyCreateMutationResult,
  type PolicyUpdateMutationResult,
} from 'admin/gql/rbac'
import { type RbacPolicy } from 'admin/types/rbac'

import { PolicyFormTemplate } from '.'

interface RbacPolicyUpdateRouteProps {
  match: {
    params: {
      id: string
    }
  }
}

const INITIAL_VALUES = {
  name: '',
  slug: '',
  rules: [],
  effect: 'allow',
}

export const PolicyPutRoute: React.FC<RbacPolicyUpdateRouteProps> = ({
  match,
}) => {
  const history = useHistory()
  const { toast } = useToasts()

  const { id } = match.params

  const { data, loading } = useQuery<PolicyQueryResult>(PoliciesQuery, {
    variables: { input: { ids: id } },
    onError: error => {
      toast.error(error.message)
    },
    skip: !id,
  })

  const policyData = data?.policies[0] ?? INITIAL_VALUES

  const [policyCreateMutation] = useMutation<PolicyCreateMutationResult>(
    RbacPolicyCreateMutation,
    {
      onCompleted: () => {
        toast.success('Successfully created policy')
        history.push('/controls/user-roles/policy')
      },
      onError: error => {
        toast.error(error.message)
      },
      refetchQueries: [{ query: PoliciesQuery, variables: { input: {} } }],
    },
  )

  const [policyUpdateMutation] = useMutation<PolicyUpdateMutationResult>(
    RbacPolicyUpdateMutation,
    {
      onCompleted: () => {
        toast.success('Successfully updated policy')
        history.push('/controls/user-roles/policy')
      },
      onError: error => {
        toast.error(error.message)
      },
      refetchQueries: [{ query: PoliciesQuery, variables: { input: {} } }],
    },
  )

  const onSubmit = async (values: RbacPolicy) => {
    const { id, name, slug, rules, effect } = values
    if (id) {
      return await policyUpdateMutation({
        variables: {
          data: {
            id,
            name,
            slug,
            rules,
            effect,
          },
        },
      })
    }
    return await policyCreateMutation({
      variables: {
        data: {
          name,
          slug,
          rules,
          effect,
        },
      },
    })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <PolicyFormTemplate
      title={`${id ? 'Update' : 'Create'} Policy`}
      initialValues={policyData}
      onSubmit={onSubmit}
    />
  )
}
