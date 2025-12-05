import { darken } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type SxThemedPropsRecord } from '@project-atl/ui'

export const styles = {
  button: {
    '&.Mui-disabled': {
      color: theme => theme.palette.neutral[700],
    },
  },
} satisfies SxThemedPropsRecord

export const useBetControlsStyles = makeStyles(theme =>
  createStyles({
    root: {
      flexShrink: 0,
      '& .MuiFormHelperText-root.Mui-disabled': {
        color: 'rgba(255, 255, 255, 0.5) !important',
      },
    },

    container: {
      padding: theme.spacing(1),
    },

    cancelBetButton: {
      color: '#fff',
      background: theme.palette.red.main,

      '&:hover': {
        background: '#fd584c',
        color: '#fff',
      },
    },

    placeBetButton: {
      color: '#fff',
      background: theme.palette.green.main,

      '&:hover': {
        background: theme.palette.green.light,
        color: '#fff',
      },
    },

    modifierButtons: {
      display: 'flex',
      height: '100%',
      paddingBlock: theme.spacing(0.5),

      '& .MuiButton-root': {
        minWidth: 'initial',
      },
    },

    activeButton: {
      color: theme.palette.primary.darker,
      backgroundColor: theme.palette.secondary.main,

      '&:hover': {
        backgroundColor: darken(theme.palette.secondary.main, 0.15),
      },
    },

    betNotice: {
      background: theme.palette.purple.main,
      color: 'rgba(255, 255, 255, 0.7)',

      fontWeight: theme.typography.fontWeightBold,
      fontSize: 12,
      padding: '0px 3px',
      borderRadius: 3,
      height: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all .3s ease',
      marginTop: 0,
      opacity: 0,

      '& .fa-info-circle': {
        marginRight: 4,
        marginBottom: 2,
      },
    },

    betNoticeVisible: {
      height: 32,
      marginTop: 6,
      opacity: 1,
    },

    maxProfit: {
      marginTop: 12,
      opacity: 0.3,
    },

    ClearTextButton__iconAdjustment: {
      marginRight: 0,
    },
  }),
)
