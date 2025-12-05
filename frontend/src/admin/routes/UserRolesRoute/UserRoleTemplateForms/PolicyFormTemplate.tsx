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
import { useAxiosGet, useToasts } from 'common/hooks'
import { RolesQuery } from 'admin/gql/rbac'
import { type RbacPolicySubmitErrors, type RbacPolicy } from 'admin/types/rbac'

import { useFormTemplateStyles } from './FormTemplate.styles'

interface AvailableRole {
  role: string
  rules: string[]
}

interface AvailableRule {
  rule: string[]
}

export interface AvailableUserRolesResponse {
  availableRoles: AvailableRole[]
}

export interface AvailableUserRulesResponse {
  availableRules: AvailableRule[]
}

export const PolicyFormTemplate = ({ title, initialValues, onSubmit }) => {
  const formRef = React.useRef<HTMLFormElement | null>(null)
  const [authorizedRules, setAuthorizedRules] = React.useState('')
  const [policiesField, setPoliciesField] = React.useState('')
  const [validRules, setValidRules] = React.useState([])
  const { toast } = useToasts()

  const classes = useFormTemplateStyles()

  const [{ data: availableRuleData, loading: loadingAvailableRules }] =
    useAxiosGet<AvailableUserRulesResponse>('/admin/roles/getAvailableRules', {
      onError: err => toast.error(err.response.data),
    })

  const rules = availableRuleData?.availableRules
    ? Object.values(availableRuleData?.availableRules).map(rule => rule?.rule)
    : []

  const validatePolicyAndSubmit = (values: RbacPolicy) => {
    const errors: RbacPolicySubmitErrors = {}

    if (formRef.current) {
      const isValid = formRef.current.checkValidity()

      if (!isValid) {
        formRef.current.reportValidity()
        return
      }
    }

    if (!values.effect) {
      toast.warn('Please add an effect to the policy.')
      return
    }

    if (!values.rules.length) {
      toast.warn('Please add rules to the policy.')
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
    errors,
    handleChange,
    setFieldValue,
    handleSubmit,
  } = useFormik({
    initialValues,
    onSubmit,
  })

  React.useEffect(() => {
    setValues(initialValues)
  }, [initialValues, setValues])

  const tableAuthorizedRules = (values.rules ?? []).map(rules => ({ rules }))

  const addRule = rule => {
    if (values.rules.includes(rule)) {
      return toast.error('rule already in place.')
    }

    if (rule) {
      setFieldValue('rules', [...values.rules, rule])
    }
  }

  const removeRule = index => {
    setFieldValue(
      'rules',
      values.rules.filter((_, i) => i !== index),
    )
  }

  const { data: roleData } = useQuery(RolesQuery, {
    variables: { input: { policyIds: values.id } },
    fetchPolicy: 'no-cache',
  })

  const appliedRole = initialValues?.id ? roleData?.roles : []
  const combinedUsers = appliedRole?.reduce(
    (result, role) => {
      // do not add duplicate users to list
      role.userIds.forEach(user => {
        if (!result.userIds.includes(user)) {
          result.userIds.push(user)
        }
      })
      return result
    },
    { userIds: [] },
  )

  const formattedUsers = combinedUsers?.userIds.map(user => ({
    user,
  }))

  const authedUserColumns = [
    {
      name: 'user',
      label: 'Authorized Users',
    },
  ]

  const roleColumns = [
    {
      name: 'name',
      label: 'Applied roles',
    },
  ]

  const ruleColumns = [
    {
      name: 'rules',
      label: 'Rules',
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        customBodyRender: (_, { rowData }) => {
          const ruleIndex = values.rules.indexOf(rowData[0])
          return (
            <div>
              <Button
                color="primary"
                variant="contained"
                size="small"
                onClick={() => removeRule(ruleIndex)}
              >
                Remove
              </Button>
            </div>
          )
        },
      },
    },
  ]

  return (
    <TitleContainer
      title={title}
      returnTo={{
        title: 'User Roles',
        link: '/controls/user-roles/policy',
      }}
      actions={() => [
        {
          value: title,
          onClick: () => validatePolicyAndSubmit(values),
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
            label="Policy Name"
            type="text"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={(errors.name as string) || undefined}
          />
          <TextField
            variant="standard"
            required
            id="slug"
            label="Policy Slug"
            type="text"
            name="slug"
            value={values.slug}
            onChange={handleChange}
            error={!!errors.slug}
            helperText={(errors.slug as string) || undefined}
          />
          <Typography variant="h6">Allow Rules?</Typography>
          <Select
            variant="standard"
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={values.effect}
            onChange={event => setFieldValue('effect', event.target.value)}
            fullWidth
          >
            <MenuItem value="allow">Allow</MenuItem>
            <MenuItem value="deny">Deny</MenuItem>
          </Select>
        </FormGroup>
        <div className={classes.Form__table}>
          <div className={classes.Table__column}>
            <Paper elevation={0} className={classes.Form__fieldContainer}>
              <Typography variant="h6">Add Rules</Typography>
              <div className={classes.Form__field}>
                {loadingAvailableRules ? (
                  <Loading />
                ) : (
                  <Select
                    variant="standard"
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={policiesField}
                    // addRule(event)
                    onChange={event => addRule(event.target.value)}
                    fullWidth
                  >
                    {rules
                      .filter(rule => !values.rules.includes(rule))
                      .map((rule, index) => (
                        <MenuItem key={index} value={rule}>
                          {rule}
                        </MenuItem>
                      ))}
                  </Select>
                )}
              </div>
            </Paper>

            <DataTable
              hideToolbar
              options={{ rowsPerPage: 5, sort: false, filter: false }}
              columns={ruleColumns}
              data={tableAuthorizedRules}
            />
          </div>
          <div className={classes.Table__column}>
            <DataTable
              hideToolbar
              options={{ rowsPerPage: 7, sort: false, filter: false }}
              columns={authedUserColumns}
              data={formattedUsers}
            />
          </div>
          <div className={classes.Table__column}>
            <DataTable
              hideToolbar
              options={{ rowsPerPage: 5, sort: false, filter: false }}
              columns={roleColumns}
              data={appliedRole}
            />
          </div>
        </div>
      </form>
    </TitleContainer>
  )
}
