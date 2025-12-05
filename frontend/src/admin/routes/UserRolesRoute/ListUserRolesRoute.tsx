import React, { useState } from 'react'
import {
  Button,
  Checkbox,
  Chip,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Tab,
  Tabs,
} from '@mui/material'
import { useMutation, useQuery } from '@apollo/client'
import { Link, useHistory } from 'react-router-dom'

import { TitleContainer, DataTable, Loading } from 'mrooi'
import { useToasts } from 'common/hooks'
import {
  PoliciesQuery,
  RbacPolicyDeleteMutation,
  RbacRoleDeleteMutation,
  RolesQuery,
  UserRolesUpdateMutation,
  type PolicyDeleteMutationResult,
  type RoleDeleteMutationResult,
  type UserRolesUpdateMutationResult,
} from 'admin/gql/rbac'
import { UsersQuery } from 'admin/gql/users'

import { useUsersRouteStyles } from './ListUserRoles.styles'

const getRoleLabel = (allRoles, role) =>
  allRoles?.find(r => r.slug === role)?.name

const baseColumns = [
  {
    name: 'id',
    label: 'ID',
    type: 'string',
    options: {
      display: false,
    },
  },
  {
    name: 'name',
    label: 'Name',
    type: 'string',
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'string',
  },
]

const tabs = {
  policies: {
    label: 'Policies',
    fetch: () => ({
      query: PoliciesQuery,
      variables: {
        input: {},
      },
      fetchPolicy: 'no-cache',
    }),
    columns: ({ deletePolicy }) => [
      ...baseColumns,
      {
        name: 'rules',
        label: 'Rules',
        type: 'array',
        options: {
          customBodyRender: value => {
            if (!value) {
              return null
            }

            const displayCount = 3
            const moreCount = value.length - displayCount
            const displayedRules = value.slice(0, displayCount).join(', ')

            if (moreCount > 0) {
              return (
                <span>
                  {displayedRules} + ({moreCount} more)
                </span>
              )
            }

            return displayedRules
          },
        },
      },
      {
        name: 'effect',
        label: 'Allowed Rules?',
        type: 'string',
      },
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const id = rowData[0]

            return (
              <div>
                <Link
                  to={`/controls/user-roles/policy/${id}`}
                  component={Button}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Edit
                </Link>
                <Button
                  color="primary"
                  size="small"
                  onClick={() =>
                    deletePolicy({ variables: { data: { ids: id } } })
                  }
                >
                  Delete
                </Button>
              </div>
            )
          },
        },
      },
    ],
  },
  roles: {
    label: 'Roles',
    fetch: () => ({
      query: RolesQuery,
      variables: {
        input: {},
      },
      fetchPolicy: 'no-cache',
    }),
    columns: ({ deleteRole }) => [
      ...baseColumns,
      {
        name: 'policies',
        label: 'Policies',
        type: 'array',
        options: {
          customBodyRender: value => {
            return value?.map(({ slug }) => slug).join(', ')
          },
        },
      },
      {
        name: 'userIds',
        label: 'Authorized Users',
        type: 'array',
        options: {
          customBodyRender: value => {
            if (!value) {
              return null
            }

            const displayCount = 3
            const moreCount = value.length - displayCount
            const displayedUsers = value.slice(0, displayCount).join(', ')

            if (moreCount > 0) {
              return (
                <span>
                  {displayedUsers} + ({moreCount} more)
                </span>
              )
            }

            return displayedUsers
          },
        },
      },
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const id = rowData[0]
            return (
              <div>
                <Link
                  to={`/controls/user-roles/role/${id}`}
                  component={Button}
                  variant="contained"
                  color="primary"
                  size="small"
                >
                  Edit
                </Link>
                <Button
                  color="primary"
                  size="small"
                  onClick={() =>
                    deleteRole({ variables: { data: { ids: id } } })
                  }
                >
                  Delete
                </Button>
              </div>
            )
          },
        },
      },
    ],
  },
  users: {
    label: 'Users',
    fetch: () => ({
      query: UsersQuery,
      variables: {
        isStaff: true,
      },
      fetchPolicy: 'no-cache',
    }),
    columns: ({ allRoles, updateRoleUsers, classes }) => [
      {
        name: 'id',
        label: 'ID',
        type: 'string',
        options: {
          display: false,
          filter: false,
          sort: false,
        },
      },
      {
        name: 'name',
        label: 'Username',
        type: 'string',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'string',
      },
      {
        name: 'roles',
        label: 'Roles',
        type: 'array',
        options: {
          customBodyRender: roles => {
            if (!roles || !roles.length) {
              return 'No roles'
            }

            return roles
              .map(slug => {
                return { slug, label: getRoleLabel(allRoles, slug) }
              })
              .filter(role => !!role.label)
              .map(role => (
                <Chip
                  className={classes.UserRolesUserList__chip}
                  key={role.slug}
                  label={role.label}
                >
                  {role.label}
                </Chip>
              ))
          },
        },
      },
      {
        name: 'actions',
        label: 'Actions',
        options: {
          sort: false,
          filter: false,
          customBodyRender: (_, { rowData }) => {
            const id = rowData[0]
            const roles = rowData[3] ?? []
            return (
              <Select
                variant="standard"
                id={`multi-chip-select-${id}`}
                multiple
                displayEmpty
                value={roles}
                onChange={event => {
                  const selectedRoleSlugs = (event?.target?.value ??
                    []) as string[]
                  const selectedRoles = selectedRoleSlugs
                    .map(
                      selectedRoleSlug =>
                        allRoles?.find(r => r.slug === selectedRoleSlug),
                    )
                    .filter(role => !!role)
                  updateRoleUsers({
                    variables: {
                      data: {
                        userId: id,
                        roleIds: selectedRoles.map(({ id }) => id),
                      },
                    },
                  })
                }}
                input={<OutlinedInput label="Modify Roles" />}
                renderValue={() => 'Modify Roles'}
              >
                {allRoles?.map(({ name, slug }) => (
                  <MenuItem key={slug} value={slug}>
                    <Checkbox checked={roles.includes(slug)} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            )
          },
        },
      },
    ],
  },
} as const

type UserRolesTableTabs = keyof typeof tabs
interface UserRolesTableProps {
  tab?: UserRolesTableTabs
}

const UserRolesTable: React.FC<UserRolesTableProps> = ({
  tab = 'policies',
}) => {
  const classes = useUsersRouteStyles()
  const history = useHistory()
  const { toast } = useToasts()
  const [tableViewTab, setTableViewTab] = useState<UserRolesTableTabs>(tab)
  const [updatedUserRoleData, setUpdatedUserRoleData] = React.useState([])

  const onError = ({ message }) => {
    toast.error(message)
  }

  const { query, variables } = tabs[tableViewTab].fetch()

  const { data, loading } = useQuery(query, {
    variables,
  })
  const { data: rolesData, loading: loadingRoles } = useQuery(RolesQuery, {
    variables: { input: {} },
  })

  const [deletePolicy] = useMutation<PolicyDeleteMutationResult>(
    RbacPolicyDeleteMutation,
    {
      onError,
      onCompleted: () => {
        toast.success('policy deleted.')
      },
      refetchQueries: [{ query: PoliciesQuery, variables: { input: {} } }],
    },
  )

  const [deleteRole] = useMutation<RoleDeleteMutationResult>(
    RbacRoleDeleteMutation,
    {
      onError,
      onCompleted: () => {
        toast.success('Role deleted.')
      },
      refetchQueries: [{ query: RolesQuery, variables: { input: {} } }],
    },
  )

  const [updateRoleUsers] = useMutation<UserRolesUpdateMutationResult>(
    UserRolesUpdateMutation,
    {
      onError,
      onCompleted: () => {
        toast.success('User role updated.')
      },
      refetchQueries: [{ query: UsersQuery, variables: { isStaff: true } }],
    },
  )

  React.useEffect(() => {
    let dataSource = null
    for (const queryKey of ['policies', 'roles', 'users']) {
      if (data?.[queryKey]) {
        dataSource = data[queryKey]
      }
    }
    if (dataSource) {
      setUpdatedUserRoleData(dataSource)
    }
  }, [data])

  const datatableOptions = {
    print: false,
    filter: true,
    search: true,
  }

  const searchOptions =
    tableViewTab === 'users'
      ? {
          label: 'Username or Email',
          columns: ['name', 'email'],
        }
      : {
          label: 'Name',
          columns: ['name'],
        }

  const loadingTable = loading || loadingRoles
  const columns = loadingTable
    ? []
    : tabs[tableViewTab].columns({
        allRoles: rolesData?.roles,
        classes,
        deletePolicy,
        deleteRole,
        updateRoleUsers,
      })

  return (
    <TitleContainer
      title="User Roles"
      actions={() => {
        if (tableViewTab === 'policies') {
          return [
            {
              value: 'Create Policy',
              onClick: () => history.push('/controls/user-roles/policy/create'),
            },
          ]
        } else if (tableViewTab === 'roles') {
          return [
            {
              value: 'Create Role',
              onClick: () => history.push('/controls/user-roles/role/create'),
            },
          ]
        }
        return []
      }}
    >
      <Tabs
        className={classes.UserRolesList_paddingBot}
        indicatorColor="primary"
        value={tableViewTab}
        onChange={(_, newTabKey) => {
          setTableViewTab(newTabKey)
        }}
      >
        {Object.entries(tabs).map(([key, tab]) => (
          <Tab
            key={key}
            value={key}
            label={tab.label}
            onClick={() => setTableViewTab(key as UserRolesTableTabs)}
          />
        ))}
      </Tabs>
      {loadingTable ? (
        <Loading />
      ) : (
        <DataTable
          columns={columns}
          data={updatedUserRoleData}
          options={datatableOptions}
          search={searchOptions}
        />
      )}
    </TitleContainer>
  )
}

export const UserRolesList: React.FC = () => <UserRolesTable tab="roles" />
export const UserPoliciesList: React.FC = () => (
  <UserRolesTable tab="policies" />
)
export const UserRolesUserList: React.FC = () => <UserRolesTable tab="users" />
