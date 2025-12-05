import React from 'react'

import { useToasts } from '../../hooks'

export const ToastUtils: React.FC = () => {
  const { toast } = useToasts()

  // Attach toast ref to window obj.
  React.useEffect(() => {
    window.toast = toast
  }, [toast])

  return <></>
}
