import React from 'react'
import {
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Paper,
} from '@mui/material'
import { useQuery, useMutation } from '@apollo/client'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { useHistory } from 'react-router-dom'
import { Loading } from '@project-atl/ui'

import {
  GameTagsNotCachedQuery,
  GameTagDeleteMutation,
  GameTagUpdateOrderMutation,
} from 'admin/gql'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'
import { isApiError } from 'common/util'
import {
  type GameTagsNotCachedQueryReturn,
  type GameTagNotCached,
} from 'admin/types'

import { useGameTagsListStyles } from './GameTagsList.styles'

export const DEFAULT_TAG = {
  title: '',
  slug: '',
  excludeFromTags: true,
  games: [],
  enabled: false,
  startDate: null,
  endDate: null,
  enableDates: false,
  order: 100,
  pageSize: 6,
  showOnHomepage: false,
}
const ReadGameTagPaper = withRulesAccessController(['tpgametags:read'], Paper)
const EditGameTagButton = withRulesAccessController(
  ['tpgametags:update'],
  Button,
)
const DeleteGameTagButton = withRulesAccessController(
  ['tpgametags:delete'],
  Button,
)
const CreateGameTagButton = withRulesAccessController(
  ['tpgametags:create'],
  Button,
)

export const GameTagsRoute: React.FC = () => {
  const classes = useGameTagsListStyles()
  const history = useHistory()
  const { toast } = useToasts()
  const { hasAccess: hasTPGameTagUpdateAccess } = useAccessControl([
    'tpgametags:update',
  ])

  const [tableRows, setTableRows] = React.useState<GameTagNotCached[]>([])
  const initialOrderRef = React.useRef<GameTagNotCached[]>([])
  const { data: tagResponse, loading: tagsLoading } =
    useQuery<GameTagsNotCachedQueryReturn>(GameTagsNotCachedQuery, {
      onError: error => {
        toast.error(error.message)
      },
    })

  const [gameTagUpdateOrderMutation] = useMutation(GameTagUpdateOrderMutation, {
    update(cache, { data }) {
      const orderedGameTags = data?.gameTagUpdateOrder
      cache.writeQuery({
        query: GameTagsNotCachedQuery,
        data: {
          gameTagsNotCached: [...orderedGameTags],
        },
      })
    },
  })

  const [gameTagDeleteMutation, { loading: deleteLoading }] = useMutation(
    GameTagDeleteMutation,
    {
      update(cache, { data }) {
        const deletedGameTagId = data?.gameTagDelete?.id
        const existingGameTags = cache.readQuery<{
          gameTagsNotCached: Array<{ id: string }>
        }>({
          query: GameTagsNotCachedQuery,
        })

        cache.writeQuery({
          query: GameTagsNotCachedQuery,
          data: {
            gameTagsNotCached: existingGameTags?.gameTagsNotCached.filter(
              gameTag => gameTag?.id !== deletedGameTagId,
            ),
          },
        })
        cache.evict({ id: deletedGameTagId })
        cache.gc()
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  React.useEffect(() => {
    if (tagResponse?.gameTagsNotCached) {
      initialOrderRef.current = tagResponse.gameTagsNotCached
      setTableRows(tagResponse.gameTagsNotCached)
    }
  }, [tagResponse?.gameTagsNotCached])

  const handleDelete = async (id, title) => {
    await gameTagDeleteMutation({ variables: { id } })
    toast.success(`Successfully deleted ${title}`)
  }

  const handleReorderClick = async () => {
    if (!hasTPGameTagUpdateAccess) {
      return toast.error('Restricted Access')
    }
    try {
      const filteredTableRows = tableRows.map(gameTag => {
        const filteredGametag = Object.keys(gameTag)
          .filter(key => !['games', '__typename'].includes(key))
          .reduce((obj, key) => {
            obj[key] = gameTag[key]
            return obj
          }, {})
        return filteredGametag
      })
      await gameTagUpdateOrderMutation({
        variables: { data: filteredTableRows },
      })
      toast.success('Successfully reordered groups')
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.response.data)
      } else {
        toast.error('Unknown error while reordering groups.')
      }
    }
  }

  const handleCancelReorderClick = () => {
    setTableRows(initialOrderRef.current)
  }

  const reorder = (
    list: GameTagNotCached[],
    startIndex: number,
    endIndex: number,
  ) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onDragEnd = result => {
    // dropped outside the list
    if (!result.destination) {
      return
    }
    setTableRows(
      reorder(tableRows, result.source.index, result.destination.index),
    )
  }

  const isEqual = (first, second) => {
    return JSON.stringify(first) === JSON.stringify(second)
  }

  return (
    <div className={classes.root}>
      <div className={classes.table}>
        <ReadGameTagPaper elevation={4} className={classes.formContainer}>
          <div className={classes.createTagContainer}>
            <CreateGameTagButton
              variant="contained"
              color="primary"
              onClick={() => history.push('/games/game-tags/create')}
            >
              Create Game Tag
            </CreateGameTagButton>
          </div>
          <div className={classes.tableContainer}>
            {tagsLoading ? (
              <Loading />
            ) : (
              <>
                <div className={classes.tableHeader}>
                  {!isEqual(tagResponse?.gameTagsNotCached, tableRows) && (
                    <>
                      <EditGameTagButton
                        color="primary"
                        variant="contained"
                        onClick={() => handleReorderClick()}
                      >
                        Reorder
                      </EditGameTagButton>
                      <Button
                        color="primary"
                        variant="outlined"
                        onClick={() => handleCancelReorderClick()}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
                <DragDropContext onDragEnd={onDragEnd}>
                  <TableContainer className={classes.innerTableContainer}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            align="left"
                            className={classes.titleTableCell}
                          >
                            Title
                          </TableCell>
                          <TableCell align="left">Casino Lobby</TableCell>
                          <TableCell align="left">Slug</TableCell>
                          <TableCell align="left">
                            Hide Tag Under Games
                          </TableCell>
                          <TableCell align="left">Number of Games</TableCell>
                          <TableCell align="left">Enabled</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <Droppable droppableId="droppable">
                        {(provided, _) => (
                          <TableBody
                            className={classes.tableBody}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {tableRows?.map((row, index) => (
                              <Draggable
                                draggableId={row.id}
                                index={index}
                                key={row.id}
                              >
                                {(provided, _) => (
                                  <TableRow
                                    key={row.id}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <TableCell
                                      className={classes.bodyTableCell}
                                    >
                                      {row.title}
                                    </TableCell>
                                    <TableCell
                                      className={classes.bodyTableCell}
                                    >
                                      {row.showOnHomepage ? 'Yes' : 'No'}
                                    </TableCell>
                                    <TableCell
                                      className={classes.bodyTableCell}
                                    >
                                      {row.slug}
                                    </TableCell>
                                    <TableCell
                                      className={classes.bodyTableCell}
                                    >
                                      {row.excludeFromTags ? 'True' : 'False'}
                                    </TableCell>
                                    <TableCell
                                      className={classes.bodyTableCell}
                                    >
                                      {row.games?.length}
                                    </TableCell>
                                    <TableCell
                                      className={classes.bodyTableCell}
                                    >
                                      {row.enabled ? 'True' : 'False'}
                                    </TableCell>
                                    <TableCell>
                                      <EditGameTagButton
                                        onClick={() =>
                                          history.push(
                                            `/games/game-tags/${row.id}/edit`,
                                          )
                                        }
                                        variant="contained"
                                        color="primary"
                                        size="medium"
                                        disabled={deleteLoading}
                                      >
                                        Edit
                                      </EditGameTagButton>
                                      <DeleteGameTagButton
                                        className={classes.actionButtons}
                                        color="primary"
                                        variant="contained"
                                        onClick={() =>
                                          handleDelete(row.id, row.title)
                                        }
                                        disabled={deleteLoading}
                                      >
                                        Delete
                                      </DeleteGameTagButton>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </TableBody>
                        )}
                      </Droppable>
                    </Table>
                  </TableContainer>
                </DragDropContext>
              </>
            )}
          </div>
        </ReadGameTagPaper>
      </div>
    </div>
  )
}
