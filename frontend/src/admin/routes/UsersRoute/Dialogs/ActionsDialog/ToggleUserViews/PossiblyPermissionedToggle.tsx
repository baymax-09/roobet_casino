import {
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Switch,
} from '@mui/material'
import clsx from 'clsx'
import React from 'react'

import { useAccessControl } from 'admin/hooks'
import { withRulesAccessController } from 'admin/components'

import { useToggleUserViewsStyles } from './ToggleUserViews.styles'

const controlledFragmentFactory = (rule: string) => {
  return withRulesAccessController([rule], React.Fragment)
}

interface BaseToggleProps {
  id: string
  label: string
  className?: string
  enabled: boolean
  disabled: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

interface PermissionedToggleProps extends BaseToggleProps {
  readRule: string
  writeRule: string
}

type SuperpositionedToggleProps = BaseToggleProps & Record<string, any>
interface PermissionedToggleGroupProps {
  groupLabel: string
  readRule?: string
  toggles: SuperpositionedToggleProps[]
}

const SuperpositionedToggle: React.FC<SuperpositionedToggleProps> = ({
  ...props
}) => {
  const propCheck = Object.keys(props)
  if (propCheck.includes('readRule') && propCheck.includes('writeRule')) {
    const permissionedProps = props as PermissionedToggleProps
    return <PermissionedToggle {...permissionedProps} />
  } else {
    return <BaseToggle {...props} />
  }
}

const BaseToggle: React.FC<BaseToggleProps> = ({
  id,
  className,
  enabled,
  disabled,
  onChange,
  label,
}) => {
  const classes = useToggleUserViewsStyles()
  return (
    <FormControlLabel
      className={clsx(className && classes[className], {
        checked: !!enabled,
      })}
      id={id}
      disabled={disabled}
      label={label}
      control={
        <Switch
          size="small"
          color="primary"
          checked={!!enabled}
          onChange={onChange}
          name={id}
        />
      }
    />
  )
}

const PermissionedToggle: React.FC<PermissionedToggleProps> = ({
  id,
  className,
  readRule,
  writeRule,
  enabled,
  disabled,
  onChange,
  label,
}) => {
  const classes = useToggleUserViewsStyles()
  const { hasAccess } = useAccessControl([writeRule])
  const PermissionControlledLabel = !hasAccess
    ? withRulesAccessController([readRule], FormControlLabel)
    : FormControlLabel

  return (
    <PermissionControlledLabel
      className={clsx(className && classes[className], {
        checked: !!enabled,
      })}
      id={id}
      disabled={disabled}
      label={label}
      control={
        <Switch
          size="small"
          color="primary"
          checked={!!enabled}
          onChange={onChange}
          name={id}
          {...(writeRule.length > 0 && { disabled: !hasAccess })}
        />
      }
    />
  )
}

type BaseToggleGroupProps = Omit<PermissionedToggleGroupProps, 'readRule'>

const BaseToggleGroup: React.FC<BaseToggleGroupProps> = ({
  groupLabel,
  toggles,
}) => {
  const classes = useToggleUserViewsStyles()
  return (
    <FormControl variant="standard" component="fieldset">
      <FormLabel
        component="legend"
        className={classes.groupLabel}
        focused={false}
      >
        {groupLabel}
      </FormLabel>
      <FormGroup>
        {toggles.map(toggle => (
          <SuperpositionedToggle key={toggle.id} {...toggle} />
        ))}
      </FormGroup>
    </FormControl>
  )
}

export const PossiblyPermissionedToggleGroup: React.FC<
  PermissionedToggleGroupProps
> = ({ groupLabel, readRule = '', toggles }) => {
  const needsPermissioned = readRule.length > 0

  if (needsPermissioned) {
    const ControlledFragment = controlledFragmentFactory(readRule)
    return (
      <ControlledFragment>
        <BaseToggleGroup groupLabel={groupLabel} toggles={toggles} />
      </ControlledFragment>
    )
  }

  return <BaseToggleGroup groupLabel={groupLabel} toggles={toggles} />
}
