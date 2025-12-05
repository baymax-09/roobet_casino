import React from 'react'
import MUIDataTable, { type MUIDataTableOptions } from 'mui-datatables'

import { useAxiosGet } from 'common/hooks'
import { Loading } from 'mrooi'

const templateColumns = [
  {
    name: 'title',
    label: 'Title',
    type: 'string',
  },
  {
    name: 'id',
    label: 'Template ID',
    type: 'number',
  },
  {
    name: 'bonus_type',
    label: 'Bonus Type',
    type: 'number',
    options: {
      customBodyRender: value => {
        if (value === 1) {
          return 'Freebet'
        }
        if (value === 2) {
          return 'Comboboost'
        }
        return undefined
      },
    },
  },
]

const options: MUIDataTableOptions = {
  download: false,
  filter: false,
  search: false,
  print: false,
  viewColumns: false,
  selectableRows: 'none',
}

interface BonusTemplateResponse {
  templates?: Array<Record<string, any>>
}

const SportsbookBonusTemplates: React.FC = () => {
  const [{ data, loading }] = useAxiosGet<BonusTemplateResponse>(
    '/admin/slotegrator/bonus-templates',
  )

  if (loading || !data) {
    return <Loading />
  }

  const templates = data?.templates ?? []

  return (
    <MUIDataTable
      title="Templates"
      columns={templateColumns}
      data={templates}
      options={options}
    />
  )
}

export default React.memo(SportsbookBonusTemplates)
