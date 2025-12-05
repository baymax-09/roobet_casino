import React from 'react'
import { type StoryFn, type Meta } from '@storybook/react'

import { DataTable } from './DataTable'
import { columns, data } from './Private'

type DataTableType = typeof DataTable

export default {
  title: 'Components/DataTable',
  component: DataTable,
} as Meta<DataTableType>

const Template: StoryFn<DataTableType> = args => <DataTable {...args} />

export const BaseDataTable = Template.bind({})
BaseDataTable.args = {
  title: 'Base Data Table',
  columns: columns,
  data: data,
}

export const DataTableWithOptions = Template.bind({})
DataTableWithOptions.args = {
  title: 'Options Data Table',
  columns: columns,
  options: {
    caseSensitive: true,
    download: true,
    print: true,
    filter: true,
    search: true,
    viewColumns: true,
    selectableRows: 'none',
  },
  search: {
    label: 'Name',
    columns: ['name', 'description', 'type'],
  },
  data: data,
}

export const DataTableWithSelectableRows = Template.bind({})
DataTableWithSelectableRows.args = {
  title: 'Single Selectable Rows Data Table',
  columns: columns,
  options: {
    selectableRows: 'single',
  },
  search: {
    label: 'Name',
    columns: ['name', 'description', 'type'],
  },
  data: data,
}

export const DataTableWithMutipleSelectableRows = Template.bind({})
DataTableWithMutipleSelectableRows.args = {
  title: 'Multiple Selectable Rows Data Table',
  columns: columns,
  options: {
    selectableRows: 'multiple',
  },
  data: data,
}

export const DataTableWithPagination = Template.bind({})
DataTableWithPagination.args = {
  title: 'Search Data Table',
  columns: columns,
  rowsEachPage: 1,
  data: data,
}
