import { useAxiosGet, useToasts } from 'common/hooks'
import { type BalanceType } from 'common/types'

export const useBalanceTypes = () => {
  const { toast } = useToasts()

  const [{ data }] = useAxiosGet<{ balanceTypes: BalanceType[] }>(
    '/settings/balanceTypes',
    {
      onError: () => toast.error('An error occurred getting balance types'),
    },
  )
  return data?.balanceTypes || []
}
