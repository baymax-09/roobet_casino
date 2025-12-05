import React, { useEffect } from 'react'
import {
  Box,
  OutlinedInput,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Chip,
  type SelectChangeEvent,
} from '@mui/material'
import { useQuery } from '@apollo/client'

import { useToasts } from 'common/hooks'
import { GameTagsNotCachedQuery } from 'admin/gql'

import { useGameTagSelectChipStyles } from './GameTagSelectChip.styles'

interface CustomSelectChipProps {
  selectedTags: string[]
  onTagsChange: (selectedTags: string[]) => void
}

export const GameTagSelectChip: React.FC<CustomSelectChipProps> = ({
  selectedTags,
  onTagsChange,
}) => {
  const { toast } = useToasts()
  const classes = useGameTagSelectChipStyles()

  const { data: tagResponse } = useQuery(GameTagsNotCachedQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  const { gameTagsNotCached } = tagResponse || {}
  const tags = gameTagsNotCached || []

  useEffect(() => {
    onTagsChange(selectedTags)
  }, [selectedTags, onTagsChange])

  const handleChange = (event: SelectChangeEvent<typeof selectedTags>) => {
    const {
      target: { value },
    } = event
    onTagsChange(typeof value === 'string' ? value.split(',') : value)
  }

  return (
    <div>
      <FormControl
        variant="standard"
        className={classes.FormControl__Container}
      >
        <InputLabel>Game Tags</InputLabel>
        <Select
          variant="standard"
          multiple
          value={selectedTags}
          onChange={handleChange}
          input={<OutlinedInput label="Game Tags" />}
          renderValue={selected => (
            <Box className={classes.Select__Item}>
              {selected.map(tagId => {
                const selectedTag = tags.find(tag => tag.id === tagId)
                return (
                  <Chip
                    key={tagId}
                    label={selectedTag ? selectedTag.title : ''}
                  />
                )
              })}
            </Box>
          )}
        >
          {tags.map(item => (
            <MenuItem key={item.id} value={item.id}>
              {item.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}
