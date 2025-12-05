import React from 'react'
import { Form, Formik } from 'formik'
import {
  Button,
  TextField,
  Typography,
  Paper,
  Select,
  InputLabel,
} from '@mui/material'
import { useQuery, useMutation } from '@apollo/client'

import { Loading, DataTable } from 'mrooi'
import {
  QuestsTemplatesQuery,
  QuestsTemplateCreateMutation,
  RewardInventoryItemQuery,
} from 'admin/gql'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { QuestsCriteriaTypeManager } from './QuestsCriteriaTypeManager'
import {
  type QuestCriteriaType,
  type QuestTemplateResults,
  type DefaultQuest,
  type QuestTemplateError,
} from '../types'

import { useQuestTemplatesRouteStyles } from './QuestTemplatesRoute.styles'

const CRITERIA_TYPES: QuestCriteriaType[] = [
  'PAGE_VIEW',
  'NEW_PLAYER_INCENTIVE',
]

const DEFAULT_QUEST: Readonly<DefaultQuest> = {
  id: '',
  name: '',
  criteriaType: CRITERIA_TYPES[0],
  rewardId: '',
  wageredAmountUSD: 0,
  urlPattern: '',
}

const CreateInventoryQuestPaper = withRulesAccessController(
  ['inventory:create'],
  Paper,
)
const CreateInventoryRewardButton = withRulesAccessController(
  ['inventory:create'],
  Button,
)
const ReadInventoryQuestDatatable = withRulesAccessController(
  ['inventory:read'],
  DataTable,
)

export const QuestTemplatesRoute: React.FC = () => {
  const classes = useQuestTemplatesRouteStyles()
  const { toast } = useToasts()
  const { hasAccess: hasInventoryRewardEditAccess } = useAccessControl([
    'inventory:update',
  ])

  const [selectedQuestId, setSelectedQuestId] = React.useState('')

  const { data: questTemplateResponse, loading: questTemplatesLoading } =
    useQuery<QuestTemplateResults>(QuestsTemplatesQuery, {
      onError: error => {
        toast.error(error.message)
      },
    })

  const { data: rewardsResponse, loading: rewardsLoading } = useQuery(
    RewardInventoryItemQuery,
    {
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const [questTemplateCreateMutation] = useMutation(
    QuestsTemplateCreateMutation,
    {
      update(cache, { data }) {
        const newQuest = data?.questTemplateCreate
        const existingQuests = cache.readQuery<QuestTemplateResults>({
          query: QuestsTemplatesQuery,
        })
        cache.writeQuery({
          query: QuestsTemplatesQuery,
          data: {
            questTemplates: [
              ...(existingQuests?.questTemplates ?? []),
              newQuest,
            ],
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const loading = questTemplatesLoading && rewardsLoading

  const data = questTemplateResponse?.questTemplates || []

  const currentQuest = React.useMemo(() => {
    const quest = data.find(quest => quest.id === selectedQuestId)
    if (quest) {
      return {
        ...quest,
        ...('wageredAmountUSD' in quest.criteriaSettings && {
          wageredAmountUSD: quest.criteriaSettings.wageredAmountUSD,
        }),
        ...('urlPattern' in quest.criteriaSettings && {
          urlPattern: quest.criteriaSettings.urlPattern,
        }),
      }
    }
    return DEFAULT_QUEST
  }, [data, selectedQuestId])

  const rewardsResponseMemo = React.useMemo(
    () => rewardsResponse?.inventoryItemRewards ?? [],
    [rewardsResponse?.inventoryItemRewards],
  )

  const rewards = React.useMemo(
    () =>
      rewardsResponseMemo.map(reward => {
        return { id: reward.id, name: reward.name }
      }),
    [rewardsResponseMemo],
  )

  const findRewardName = (rewardId: string) => {
    const item = rewards.find(reward => {
      return reward.id === rewardId
    })
    return item?.name ?? 'None'
  }

  const rows = (data ?? []).map(quest => ({
    Name: quest.name,
    'Criteria Type': quest.criteriaType,
    Reward: findRewardName(quest.rewardId),
    Id: quest.id,
  }))

  const columns = React.useMemo(
    () => [
      {
        name: 'Name',
        label: 'Name',
        options: {
          filter: true,
          sort: true,
        },
      },
      {
        name: 'Criteria Type',
        label: 'Criteria Type',
        options: {
          filter: true,
          display: true,
        },
      },
      {
        name: 'Reward',
        label: 'Reward',
        options: {
          filter: true,
          display: true,
        },
      },
    ],
    [data],
  )

  const handleEdit = (id: string) => {
    setSelectedQuestId(id)
  }

  const onSubmit = async (values: DefaultQuest, { resetForm }) => {
    const { id, name, criteriaType, wageredAmountUSD, urlPattern, rewardId } =
      values

    if (id) {
      setSelectedQuestId('')
      return
    }
    const result = await questTemplateCreateMutation({
      variables: {
        data: {
          name,
          criteriaType,
          criteriaSettings: {
            ...(wageredAmountUSD && { wageredAmountUSD }),
            ...(urlPattern && { urlPattern }),
          },
          rewardId: !rewardId ? null : rewardId,
        },
      },
    })
    if (!result.errors) {
      toast.success(`Successfully created ${name}`)
      resetForm({ values: DEFAULT_QUEST })
      setSelectedQuestId('')
    }
  }

  const validateQuestForm = (values: DefaultQuest) => {
    const { name, criteriaType, urlPattern, wageredAmountUSD } = values

    const errors: QuestTemplateError = {}

    if (!name.length) {
      errors.name = 'Must specify a name'
    }

    if (criteriaType === CRITERIA_TYPES[0] && !urlPattern) {
      errors.urlPattern = 'Must specify url pattern'
    }
    if (criteriaType === CRITERIA_TYPES[1] && !wageredAmountUSD) {
      errors.wageredAmountUSD = 'Must specify wagered amount'
    }

    return errors
  }

  return (
    <div className={classes.root}>
      <div className={classes.questsContainer}>
        <CreateInventoryQuestPaper
          elevation={2}
          className={classes.formContainer}
        >
          <Typography variant="h4" className={classes.title}>
            {currentQuest.id ? '' : 'Create'} Quest
          </Typography>
          <div>
            <Formik
              enableReinitialize
              initialValues={currentQuest}
              onSubmit={onSubmit}
              validate={validateQuestForm}
              validateOnChange={false}
            >
              {({ values, errors, handleChange }) => (
                <Form className={classes.form}>
                  <div className={classes.header}>
                    <div className={classes.rightHeader}>
                      <TextField
                        variant="standard"
                        name="name"
                        value={values.name}
                        error={!!errors.name}
                        helperText={errors.name}
                        onChange={handleChange}
                        label="Name"
                      />
                      <InputLabel>Criteria Type</InputLabel>
                      <Select
                        variant="standard"
                        native
                        name="criteriaType"
                        value={values.criteriaType}
                        onChange={handleChange}
                        label="Type"
                      >
                        {CRITERIA_TYPES.map(value => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                      <QuestsCriteriaTypeManager
                        values={values}
                        handleChange={handleChange}
                        errors={errors}
                      />
                      <InputLabel>Reward Upon Quest Completion</InputLabel>
                      <Select
                        variant="standard"
                        native
                        name="rewardId"
                        value={values.rewardId ?? ''}
                        onChange={handleChange}
                        label="Type"
                      >
                        <option key="none-value" value={DEFAULT_QUEST.rewardId}>
                          None
                        </option>
                        {rewards.map(value => (
                          <option key={value.id} value={value.id}>
                            {value.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className={classes.formButtons}>
                    <Button
                      size="large"
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      {currentQuest.id ? 'Cancel' : 'Create'}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </CreateInventoryQuestPaper>
      </div>
      <div>
        {loading ? (
          <Loading />
        ) : (
          <ReadInventoryQuestDatatable
            title="Quests"
            data={rows}
            columns={columns}
            rowsEachPage={10}
            options={{
              caseSensitive: true,
              download: false,
              print: false,
              viewColumns: false,
              selectableRows: 'none',
              onRowClick: (_, rowMeta) => {
                hasInventoryRewardEditAccess &&
                  handleEdit(rows[rowMeta.dataIndex].Id)
              },
            }}
            search={{
              label: 'Name',
              columns: ['Name'],
            }}
          />
        )}
      </div>
    </div>
  )
}
