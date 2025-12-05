import React from 'react'
import {
  Button,
  FormGroup,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useFormik } from 'formik'
import { useQuery } from '@apollo/client'

import { DataTable, TitleContainer, Loading } from 'mrooi'
import { PoliciesQuery } from 'admin/gql/rbac'
import { useToasts } from 'common/hooks'
import { type RbacRole, type RbacRoleSubmitErrors } from 'admin/types/rbac'

import { useFormTemplateStyles } from './FormTemplate.styles'

export const RoleFormTemplate = ({ title, initialValues, onSubmit }) => {
  const { toast } = useToasts()
  const [authorizedUserField, setAuthorizedUserField] = React.useState('')
  const [policyField, setPolicyField] = React.useState('')
  const formRef = React.useRef<HTMLFormElement | null>(null)

  const classes = {
    ...useFormTemplateStyles(),
  }

  const validateRoleAndSubmit = (values: RbacRole) => {
    const errors: RbacRoleSubmitErrors = {}

    if (formRef.current) {
      const isValid = formRef.current.checkValidity()

      if (!isValid) {
        formRef.current.reportValidity()
        return
      }
    }

    if (!values.policyIds.length) {
      toast.warn('Please add a policy to the role.')
      return
    }

    if (!values.userIds.length) {
      toast.warn('Please add a user to the role.')
      return
    }

    if (Object.keys(errors).length) {
      return errors
    }

    return onSubmit(values)
  }

  const {
    values,
    setValues,
    handleChange,
    setFieldValue,
    handleSubmit,
    errors,
  } = useFormik<RbacRole>({
    initialValues,
    onSubmit,
  })

  React.useEffect(() => {
    setValues(initialValues)
  }, [initialValues, setValues])

  const { data, loading } = useQuery(PoliciesQuery, {
    variables: { input: {} },
  })
  const policies = data?.policies ?? []

  const removeAuthorizedUser = index => {
    setFieldValue(
      'userIds',
      values.userIds.filter((_, i) => i !== index),
    )
  }

  const removePolicy = index => {
    setFieldValue(
      'policyIds',
      values.policyIds.filter((_, i) => i !== index),
    )
  }

  const addAuthorizedUser = user => {
    if (values.userIds.includes(user)) {
      return toast.error('User already authorized.')
    }

    if (user) {
      setFieldValue('userIds', [...values.userIds, user])
      setAuthorizedUserField('')
    }
  }

  const addPolicy = policy => {
    setFieldValue('policyIds', [...values.policyIds, policy.target.value])
  }

  const baseUserColumns = [
    {
      name: 'authorizedUsers',
      label: 'Authorized Users',
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        customBodyRender: (_, { rowData }) => {
          const index = values.userIds.indexOf(rowData[0])
          return (
            <div>
              <Button
                color="primary"
                variant="contained"
                size="small"
                onClick={() => removeAuthorizedUser(index)}
              >
                Remove
              </Button>
            </div>
          )
        },
      },
    },
  ]

  const { data: policiesData } = useQuery(PoliciesQuery, {
    variables: { input: { ids: values.policyIds } },
    fetchPolicy: 'no-cache',
  })

  const appliedPolicy = policiesData?.policies ?? []

  const policyColumns = [
    {
      name: 'id',
      label: 'Policy ID',
    },
    {
      name: 'name',
      label: 'Policy Name',
    },
    {
      name: 'rules',
      label: 'Rules',
      options: {
        customBodyRender: value => {
          return value?.join(', ')
        },
      },
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        customBodyRender: (_, { rowData }) => {
          const policyIndex = values.policyIds.indexOf(rowData[0])
          return (
            <div>
              <Button
                color="primary"
                variant="contained"
                size="small"
                onClick={() => removePolicy(policyIndex)}
              >
                Remove
              </Button>
            </div>
          )
        },
      },
    },
  ]

  const tableAuthorizedUsers = (values.userIds ?? []).map(authorizedUsers => ({
    authorizedUsers,
  }))

  if (loading) {
    return <Loading />
  }

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'User Roles',
        link: '/controls/user-roles/role',
      }}
      actions={() => [
        {
          value: title,
          onClick: () => validateRoleAndSubmit(values),
        },
      ]}
    >
      <form
        className={classes.Form__container}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <FormGroup>
          <TextField
            variant="standard"
            required
            id="name"
            label="Role Name"
            type="text"
            name="name"
            error={!!errors.name}
            helperText={(errors.name as string) || undefined}
            value={values.name}
            onChange={handleChange}
          />
          <TextField
            variant="standard"
            required
            id="slug"
            label="Role Slug"
            type="text"
            name="slug"
            error={!!errors.slug}
            helperText={(errors.slug as string) || undefined}
            value={values.slug}
            onChange={handleChange}
          />
        </FormGroup>
        <div className={classes.Form__table}>
          <div className={classes.Table__policy_column}>
            <Paper elevation={0} className={classes.Form__fieldContainer}>
              <Typography variant="h6">Add Policy</Typography>
              <Select
                variant="standard"
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={policyField}
                onChange={event => addPolicy(event)}
                fullWidth
              >
                {policies
                  .filter(policy => !values.policyIds.includes(policy.id))
                  .map(policy => (
                    <MenuItem key={policy.id} value={policy.id}>
                      {policy.name}
                    </MenuItem>
                  ))}
              </Select>
            </Paper>

            <DataTable
              hideToolbar
              options={{ rowsPerPage: 5, sort: false, filter: false }}
              columns={policyColumns}
              data={appliedPolicy}
            />
          </div>
          <div className={classes.Table__column}>
            <Paper elevation={0} className={classes.Form__fieldContainer}>
              <Typography variant="h6">Add Staff Member</Typography>
              <div className={classes.Form__field}>
                <TextField
                  variant="standard"
                  fullWidth
                  id="user"
                  label="Username or ID"
                  name="user"
                  type="text"
                  value={authorizedUserField}
                  onChange={({ target }) =>
                    setAuthorizedUserField(target.value)
                  }
                />

                <Button
                  onClick={() => addAuthorizedUser(authorizedUserField)}
                  variant="contained"
                  color="primary"
                  size="small"
                  className={classes.Form__action}
                >
                  Add
                </Button>
              </div>
            </Paper>

            <DataTable
              hideToolbar
              options={{ rowsPerPage: 5, sort: false, filter: false }}
              columns={baseUserColumns}
              data={tableAuthorizedUsers}
            />
          </div>
        </div>
      </form>
    </TitleContainer>
  )
}
