import React from 'react'
import {
  type FilledTextFieldProps,
  TextField,
  type TextFieldProps,
} from '@mui/material'

import { styles } from './ControlTextField.styles'

type ControlTextFieldProps = Partial<TextFieldProps> & {
  InputProps?: Partial<FilledTextFieldProps['InputProps']>
}

const ControlTextField: React.FC<ControlTextFieldProps> = ({
  InputProps = {},
  ...otherProps
}) => (
  <TextField
    {...otherProps}
    fullWidth
    variant="filled"
    size="small"
    InputProps={{
      ...InputProps,
      sx: styles.input,
    }}
    InputLabelProps={{
      shrink: true,
      sx: styles.label,
    }}
  />
)

export default React.memo(ControlTextField)
