import React, { type HTMLInputTypeAttribute } from 'react'

export interface ConfirmContextInput {
  key: string
  type?: HTMLInputTypeAttribute | 'select' | 'datepicker'
  name?: string
  defaultValue?: any
  required?: boolean
  options?: Array<{ key: any; value: any }>
  helperText?: string
}

export interface UseConfirmContextArgs {
  title: string
  message: string | React.ReactElement
  inputs?: ConfirmContextInput[]
}

// TODO construct Params type definition from args input list
type useConfirmContext = <Params extends object>(
  args: UseConfirmContextArgs,
) => Promise<Params>

// TODO what would be an appropriate default value?
export const ConfirmDialogContext = React.createContext<
  useConfirmContext | undefined
>(undefined)
