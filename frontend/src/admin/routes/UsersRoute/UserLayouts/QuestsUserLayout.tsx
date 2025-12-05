import React from 'react'
import { useQuery } from '@apollo/client'
import { Select, InputLabel, FormControl, MenuItem } from '@mui/material'
import numeral from 'numeral'
import { type MUIDataTableColumn } from 'mui-datatables'

import { QuestsACPQuery } from 'admin/gql'
import { Loading, DataTable } from 'mrooi'
import { type QuestsResultsACP } from 'admin/routes/InventoryRoute/types'
import { useToasts } from 'common/hooks'
import { exists } from 'common/util'

import { useQuestsUserLayoutStyles } from './QuestsUserLayout.styles'

interface QuestsUserLayoutProps {
  userId: string
}

// TODO: Make this dynamic, useQuery, once more quest types are introduced/used
const QUEST_TYPES = ['NEW_PLAYER_INCENTIVE']

export const QuestsUserLayout: React.FC<QuestsUserLayoutProps> = ({
  userId,
}) => {
  const classes = useQuestsUserLayoutStyles()
  const { toast } = useToasts()
  const [selectedQuestType, setSelectedQuestType] = React.useState<string>(
    'NEW_PLAYER_INCENTIVE',
  )

  const { data: userQuestsResponse, loading } = useQuery<QuestsResultsACP>(
    QuestsACPQuery,
    {
      variables: {
        criteriaType: selectedQuestType,
        completed: false,
        userId,
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const data = userQuestsResponse?.questsACP

  const columns: MUIDataTableColumn[] = React.useMemo(
    () =>
      [
        {
          label: 'Quest Name',
          name: 'name',
          options: {
            filter: true,
            sort: true,
            display: true,
          },
        },
        selectedQuestType === 'NEW_PLAYER_INCENTIVE'
          ? {
              label: 'Total Wagered',
              name: 'userWageredAmountUSD',
              options: {
                filter: true,
                sort: true,
                display: true,
                customBodyRenderLite: dataIndex => {
                  if (!data) {
                    return 'No wager amount found'
                  }
                  const amount = data[dataIndex].userWageredAmountUSD
                  return numeral(amount).format('$0,0.00')
                },
              },
            }
          : null,
        {
          label: 'Progress',
          name: 'progress',
          options: {
            filter: true,
            sort: true,
            display: true,
            customBodyRenderLite: dataIndex => {
              if (!data) {
                return 'No progress found'
              }
              return `${data[dataIndex].progress}%`
            },
          },
        },
      ].filter(exists),
    [data],
  )

  const handleChange = ({ target: { value } }) => {
    setSelectedQuestType(value)
  }

  return (
    <div className={classes.root}>
      <div>
        <FormControl variant="outlined" className={classes.formControl}>
          <InputLabel htmlFor="selectedQuestTypes">Quest Type</InputLabel>
          <Select
            variant="standard"
            name="selectedQuestTypes"
            value={selectedQuestType}
            onChange={handleChange}
            label="Rarity"
          >
            {QUEST_TYPES.map(value => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {loading || !data ? (
        <Loading />
      ) : (
        <div>
          <DataTable
            title="Active Quests"
            data={data}
            columns={columns}
            rowsEachPage={10}
          />
        </div>
      )}
    </div>
  )
}
