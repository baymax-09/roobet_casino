import React, { useState } from 'react'
import moment from 'moment'
import { type StoryFn, type Meta } from '@storybook/react'

import { DateRangePicker } from 'mrooi'

const MOMENT_FORMAT = 'YYYYMMDD'

type DateRangePickerType = typeof DateRangePicker

export default {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  argTypes: {
    disableFuture: { control: 'boolean' },
  },
} as Meta<DateRangePickerType>

const Template: StoryFn<DateRangePickerType> = args => {
  const [dateRange, setDateRange] = useState({
    start: moment().format(MOMENT_FORMAT),
    end: moment().format(MOMENT_FORMAT),
  })

  const handleDateRangeChange = value => {
    setDateRange(value)
  }

  return (
    <DateRangePicker
      {...args}
      selectedDateRange={dateRange}
      onChange={value => handleDateRangeChange(value)}
    />
  )
}

export const DefaultACP = Template.bind({})
DefaultACP.args = {}

DefaultACP.parameters = {
  theme: 'ACPLightMode',
}
