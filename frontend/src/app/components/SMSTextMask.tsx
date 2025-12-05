import React from 'react'
import MaskedInput from 'react-text-mask'
import createAutoCorrectedDatePipe from 'text-mask-addons/dist/createAutoCorrectedDatePipe'

const autoCorrectedDatePipe = createAutoCorrectedDatePipe('dd/mm/yyyy')

interface SMSTextMaskProps {
  inputRef: any
}

export const SMSTextMask: React.FC<SMSTextMaskProps> = React.memo(
  ({ inputRef, ...other }) => (
    <MaskedInput
      {...other}
      ref={ref => {
        inputRef(ref ? ref.inputElement : null)
      }}
      mask={[
        '+',
        /\d/,
        ' ',
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
