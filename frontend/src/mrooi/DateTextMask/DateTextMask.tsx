import React from 'react'
import MaskedInput from 'react-text-mask'
import createAutoCorrectedDatePipe from 'text-mask-addons/dist/createAutoCorrectedDatePipe'

const autoCorrectedDatePipe = createAutoCorrectedDatePipe('dd/mm/yyyy')

interface DateTextMaskProps {
  inputRef: (ref: any) => void
  placeholder: string
  disabled: boolean
}

export const DateTextMask: React.FC<DateTextMaskProps> = React.memo(
  ({ inputRef, ...other }) => {
    return (
      <MaskedInput
        {...other}
        ref={ref => {
          inputRef(ref ? ref.inputElement : null)
        }}
        mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
        pipe={autoCorrectedDatePipe}
        placeholderChar={'\u2000'}
        guide={false}
        showMask
      />
    )
  },
)
