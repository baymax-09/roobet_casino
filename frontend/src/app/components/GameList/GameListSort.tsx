import React from 'react'
import { Dropdown } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'

interface UIGameListSortProps {
  defaultSort: string
  updateSort: (sort: string) => void
  updateAscending: (ascending: boolean) => void
  includeRecommendedSort?: boolean
  sortWidth: string | number
}

const ORDERS = [
  {
    key: 'pop_desc',
    sort: 'pop_desc',
    ascending: false,
    // translate('gameList.mostPopular')
    name: 'gameList.mostPopular',
  },
  {
    key: 'recommended',
    sort: 'recommended',
    ascending: false,
    // translate('gameList.recommended')
    name: 'gameList.recommended',
  },
  {
    key: 'title_asc',
    sort: 'title_asc',
    ascending: true,
    // translate('gameList.titleAZ')
    name: 'gameList.titleAZ',
  },
  {
    key: 'title_desc',
    sort: 'title_desc',
    ascending: false,
    // translate('gameList.titleZA')
    name: 'gameList.titleZA',
  },
  {
    key: 'releasedAt',
    sort: 'releasedAt',
    ascending: false,
    // translate('gameList.newest')
    name: 'gameList.newest',
  },
] as const

const GameListSort: React.FC<UIGameListSortProps> = ({
  defaultSort,
  updateSort,
  updateAscending,
  includeRecommendedSort,
  sortWidth,
}) => {
  const translate = useTranslate()

  const possibleOrders = includeRecommendedSort
    ? ORDERS
    : ORDERS.filter(item => item.key !== 'recommended')

  const [selectedOrder, setSelectedOrder] = React.useState(
    possibleOrders.find(({ key }) => key === defaultSort) ?? possibleOrders[0],
  )

  React.useEffect(() => {
    updateSort(selectedOrder.sort)
    updateAscending(selectedOrder.ascending)
  }, [selectedOrder, updateSort])

  const handleOnChange = React.useCallback(
    event => {
      const { value } = event.target
      const order =
        possibleOrders.find(({ key }) => key === value) ?? possibleOrders[0]
      setSelectedOrder(order)
    },
    [possibleOrders],
  )

  return (
    <Dropdown
      fullWidth
      sx={{ height: 40 }}
      label={`${translate('gameList.sortBy')}:`}
      value={selectedOrder.key}
      onChange={handleOnChange}
      displayValue={translate(selectedOrder.name)}
      dropdownWidth={sortWidth}
      menuOptions={possibleOrders.map(order => ({
        name: translate(order.name),
        value: order.key,
      }))}
    />
  )
}

export default React.memo(GameListSort)
