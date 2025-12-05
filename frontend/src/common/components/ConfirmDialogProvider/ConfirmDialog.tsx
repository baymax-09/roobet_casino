import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'

import { DateTimePicker } from 'mrooi'

import { type ConfirmContextInput } from './ConfirmDialogContext'

import { useConfirmDialogProviderStyles } from './ConfirmDialog.styles'

interface ConfirmDialogProps {
  inputs: ConfirmContextInput[]
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onExited: (node: HTMLElement) => void
  onConfirm: (form: any) => void
  onCancel: () => void
  closeMe: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  inputs = [],
  title = 'Confirm Action',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onExited,
  onConfirm,
  onCancel,
  closeMe,
}) => {
  const classes = useConfirmDialogProviderStyles()
  const { register, handleSubmit, errors, control } = useForm()

  const onDialogClose = (_, reason) => {
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      closeMe()
    }
  }

  const getInput = React.useCallback(
    (input: ConfirmContextInput, index: number) => {
      if (input.type === 'select') {
        return (
          <FormControl
            variant="standard"
            fullWidth
            key={input.key}
            className={classes.formControl}
            error={!!errors[input.key]}
          >
            <InputLabel>{input.name}</InputLabel>
            <Controller
              name={input.key}
              control={control}
              rules={{ required: !!input.required }}
              defaultValue={input.defaultValue}
              render={({ onChange, value, name, ref }) => (
                <Select
                  variant="standard"
                  name={name}
                  value={value}
                  onChange={onChange}
                >
                  {input.options?.map(option => (
                    <MenuItem key={option.key} value={option.key}>
                      {option.value}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <FormHelperText>
              {errors[input.key]
                ? `${input.name} is required`
                : input.helperText}
            </FormHelperText>
          </FormControl>
        )
      }
      if (input.type === 'datepicker') {
        return (
          // as per react-hook-form documentation: https://react-hook-form.com/api#Controller
          // since Material Pickers requires controlled components and react-hook-form requires
          // uncontrolled components, we need to use a Controller
          <Controller
            name={input.key}
            defaultValue={input.defaultValue || null}
            control={control}
            key={input.key}
            // rules={{ required: true }}
            render={({ onChange, onBlur, value, name, ref }) => (
              <DateTimePicker
                className={classes.datePicker}
                fullWidth
                name={name}
                label={input.name}
                value={value}
                disablePast
                onChange={onChange}
              />
            )}
          />
        )
      }
      if (input.type === 'checkbox') {
        return (
          <FormControlLabel
            className={classes.Checkbox__label}
            control={
              <Checkbox
                key={input.key}
                color="primary"
                defaultChecked={input.defaultValue}
                inputRef={register({ required: input.required !== false })}
                name={input.key}
              />
            }
            label={input.name}
            labelPlacement="start"
          />
        )
      }
      return (
        <TextField
          variant="standard"
          defaultValue={input.defaultValue}
          type={input.type || 'text'}
          error={!!errors[input.key]}
          name={input.key}
          key={input.key}
          label={input.name}
          style={{ marginBottom: 8 }}
          placeholder={input.name}
          inputRef={register({ required: input.required !== false })}
          autoFocus={index === 0}
          helperText={
            errors[input.key] ? `${input.name} is required` : input.helperText
          }
          fullWidth
          autoComplete="off"
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      )
    },
    [inputs],
  )
  return (
    <Dialog
      onClose={onDialogClose}
      fullWidth
      TransitionProps={{
        onExited,
      }}
      open
      maxWidth="xs"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText className={classes.message} component="div">
          {message}
        </DialogContentText>
        <form className={classes.form} onSubmit={handleSubmit(onConfirm)}>
          {inputs.map((input, index) => getInput(input, index))}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          {cancelText}
        </Button>
        <Button onClick={handleSubmit(onConfirm)} color="primary">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
