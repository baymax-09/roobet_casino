import React from 'react'
import MaskedInput from 'react-text-mask'

interface PhoneTextMaskProps {
  inputRef: any
}

export const PhoneTextMask: React.FC<PhoneTextMaskProps> = React.memo(
  ({ inputRef, ...other }) => (
    <MaskedInput
      {...other}
      ref={ref => {
        inputRef(ref ? ref.inputElement : null)
      }}
      mask={[
        '(',
        /[1-9]/,
        /\d/,
        /\d/,
        ')',
        ' ',
        /\d/,
        /\d/,
        /\d/,
        '-',
        /\d/,
        /\d/,
        /\d/,
        /\d/,
      ]}
      guide={false}
      showMask
    />
  ),
)
