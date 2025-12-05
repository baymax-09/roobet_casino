import { type SxProps, lighten, type Theme } from '@mui/material'

export const styles = {
  input: {
    background: '#14152b',
    borderRadius: 0.5,
    color: 'common.white',
    height: 34,
    paddingInline: 1.5,

    '& .MuiInputBase-input': {
      padding: 0,
    },

    '& .MuiInputAdornment-root': {
      marginTop: `0 !important`,
    },

    '& input::-webkit-inner-spin-button, input::-webkit-outer-spin-button': {
      '-webkitAppearance': 'none',
      margin: 0,
    },

    '&:hover': {
      background: lighten('#14152b', 0.02),
      '&::before': {
        borderBottomColor: 'rgba(255, 255, 255, 0.10)',
      },
    },

    '& :is(div, p)': {
      color: 'currentColor',
    },

    '&.Mui-focused': {
      background: lighten('#14152b', 0.04),
    },

    '&.Mui-disabled, & input.Mui-disabled': {
      color: 'neutral.600',
      WebkitTextFillColor: 'revert',
    },

    '&::before': {
      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    },
  },

  label: {
    fontWeight: theme => theme.typography.fontWeightMedium,
    fontSize: '0.725rem',
    marginBottom: '0.25rem',
    '&.Mui-disabled': {
      color: 'neutral.600',
    },
  },
} satisfies Record<PropertyKey, SxProps<Theme>>
