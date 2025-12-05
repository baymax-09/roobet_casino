import React from 'react'
import {
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  InputBase,
} from '@mui/material'
import ContentEditable from 'react-contenteditable'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import moment from 'moment'

import { api } from 'common/util'
import { useAxiosGet, useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'

import { type UserData } from '../types'

import { useUserNotesStyles } from './UserNotes.styles'

type UserNoteType = 'admin' | 'userAction'

interface UserNote {
  _id: string
  userId: string
  adminUserId: string
  adminName: string
  department?: string
  note: string
  createdAt?: Date
  type: UserNoteType
}

interface UserNotesProps {
  userData: UserData
  loggedInUserId: string
}

const CreateNoteCard = withRulesAccessController(['user_notes:create'], Card)
const EditNoteIcon = withRulesAccessController(
  ['user_notes:create'],
  IconButton,
)
const DeleteNoteIcon = withRulesAccessController(
  ['user_notes:delete'],
  IconButton,
)

export const UserNotes: React.FC<UserNotesProps> = ({
  userData,
  loggedInUserId,
}) => {
  const classes = useUserNotesStyles()
  const [userNotes, setUserNotes] = React.useState<UserNote[]>([])
  const [newNote, setNewNote] = React.useState('')
  const [noteBeingEdited, setNoteBeingEdited] = React.useState<UserNote | null>(
    null,
  )
  const [type, setType] = React.useState('admin')
  const { toast } = useToasts()

  const handleTypeChange = event => {
    setType(event.target.value)
  }

  const userNoteContentEditableRefs = React.useRef<
    Array<{ id: string; ref: HTMLTextAreaElement }>
  >([])

  useAxiosGet<UserNote[]>(
    `/admin/notes/userNotes?userId=${userData.user.id}&type=${type}`,
    {
      onCompleted: data => {
        setUserNotes(data)
      },
      onError: error => {
        toast.error(error.response.data)
      },
    },
  )

  React.useEffect(() => {
    // for focusing the div once it's being edited
    if (noteBeingEdited) {
      const note = userNoteContentEditableRefs.current.find(
        elem => elem.id === noteBeingEdited._id,
      )

      note?.ref.focus()
    }
  }, [noteBeingEdited])

  const createUserNote = () => {
    if (newNote.length === 0) {
      return
    }

    api
      .post<unknown, UserNote, { userId: string; note: string }>(
        '/admin/notes/userNote',
        {
          userId: userData.user.id,
          note: newNote,
        },
      )
      .then(response => {
        setUserNotes([response, ...userNotes])
        setNewNote('')
      })
      .catch(error => {
        toast.error(error.response.data)
      })
  }

  const deleteUserNote = noteId => {
    api
      .post('/admin/notes/deleteUserNote', {
        noteId,
      })
      .then(() => {
        setUserNotes(userNotes.filter(elem => elem._id !== noteId))
      })
      .catch(error => {
        toast.error(error.response.data)
      })
  }

  const editUserNote = noteId => {
    const noteBeingEdited = userNotes.find(elem => elem._id === noteId)
    setNoteBeingEdited(noteBeingEdited || null)
  }

  const submitEditedUserNote = noteId => {
    stopEditing()

    if (noteBeingEdited === null) {
      return
    }

    api
      .post('/admin/notes/userNote', {
        noteId,
        userId: userData.user.id,
        note: noteBeingEdited?.note,
      })
      .then(() => {
        const newUserNotes = [...userNotes]
        const editedNote = newUserNotes.find(elem => elem._id === noteId)
        if (editedNote !== undefined) {
          editedNote.note = noteBeingEdited?.note
        }
        setUserNotes(newUserNotes)
      })
      .catch(error => {
        toast.error(error.response.data)
      })
  }

  const stopEditing = () => {
    setNoteBeingEdited(null)
  }

  return (
    <Card className={classes.userNotesCard}>
      <FormControl variant="standard" className={classes.noteSelect}>
        <Select variant="standard" value={type} onChange={handleTypeChange}>
          <MenuItem value="admin">Admin Notes/Actions</MenuItem>
          <MenuItem value="userAction">Player Actions</MenuItem>
        </Select>
        <FormHelperText>Type of note to show</FormHelperText>
      </FormControl>
      <CardContent>
        {type !== 'userAction' && (
          <CreateNoteCard className={classes.userNoteTextBox}>
            <div className={classes.userNoteTextFieldContainer}>
              <InputBase
                multiline
                className={classes.userNoteTextField}
                onChange={event => setNewNote(event.target.value)}
                placeholder="Write your note here..."
              />
              <div className={classes.userNoteButtonContainer}>
                <Button color="primary" onClick={createUserNote}>
                  Create Note
                </Button>
              </div>
            </div>
          </CreateNoteCard>
        )}

        {userNotes.map(
          ({ adminName, note, _id, userId, createdAt, department }, index) => {
            return (
              <Card className={classes.userNote} key={_id}>
                <CardContent>
                  <div className={classes.userNoteHeader}>
                    <div className={classes.userNoteInfo}>
                      <Typography color="textSecondary" variant="h6">
                        {department && `[${department}] - `}
                        {adminName}
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {moment(createdAt).format('lll')}
                      </Typography>
                    </div>

                    <div className={classes.userNoteActions}>
                      {loggedInUserId === userId &&
                        (noteBeingEdited && noteBeingEdited._id === _id ? (
                          <EditNoteIcon
                            size="small"
                            onClick={() => stopEditing()}
                          >
                            <CloseIcon />
                          </EditNoteIcon>
                        ) : (
                          <EditNoteIcon
                            size="small"
                            onClick={() => editUserNote(_id)}
                          >
                            <EditIcon />
                          </EditNoteIcon>
                        ))}

                      <DeleteNoteIcon
                        size="small"
                        onClick={() => deleteUserNote(_id)}
                      >
                        <DeleteIcon />
                      </DeleteNoteIcon>
                    </div>
                  </div>
                  {noteBeingEdited?._id === _id ? (
                    <InputBase
                      multiline
                      className={classes.userNoteTextField}
                      value={noteBeingEdited ? noteBeingEdited.note : ''}
                      onChange={event => {
                        setNoteBeingEdited(prevNote => {
                          if (prevNote) {
                            return {
                              ...prevNote,
                              note: event.target.value,
                            }
                          }
                          return null
                        })
                      }}
                      placeholder="Write your note here..."
                      inputRef={ref =>
                        (userNoteContentEditableRefs.current[index] = {
                          id: _id,
                          ref,
                        })
                      }
                    />
                  ) : (
                    <ContentEditable
                      onChange={() => {}}
                      className={classes.userNoteTextField}
                      html={noteBeingEdited ? noteBeingEdited.note : ''}
                      // we need to toggle display rather than use conditional rendering
                      // because we need the refs to be set on mount
                      style={{
                        display:
                          noteBeingEdited && noteBeingEdited._id === _id
                            ? 'block'
                            : 'none',
                      }}
                      // NOTE: placeholder is not a valid prop for this component, we added it with the CSS class
                      placeholder="Write your note here..."
                      // makes an array with an entry for each note, all values will be null except the one being edited
                      innerRef={ref =>
                        (userNoteContentEditableRefs.current[index] = {
                          id: _id,
                          ref,
                        })
                      }
                    />
                  )}

                  {noteBeingEdited && noteBeingEdited._id === _id && (
                    <div className={classes.userNoteButtonContainer}>
                      <Button
                        color="primary"
                        onClick={() => submitEditedUserNote(_id)}
                      >
                        Save
                      </Button>
                    </div>
                  )}

                  {/* The easiest/safest way to render the HTML is by using another content editable that is permanently disabled */}
                  <ContentEditable
                    onChange={() => {}}
                    // variant={'body1'}
                    disabled={true}
                    html={note}
                    style={{
                      display:
                        noteBeingEdited && noteBeingEdited._id === _id
                          ? 'none'
                          : 'block',
                    }}
                  />
                </CardContent>
              </Card>
            )
          },
        )}
      </CardContent>
    </Card>
  )
}
