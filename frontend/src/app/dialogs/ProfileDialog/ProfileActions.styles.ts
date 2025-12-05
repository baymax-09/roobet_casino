import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useProfileActionsStyles = makeStyles(() =>
  createStyles({
    ProfileActions: {
      display: 'grid',
      gap: uiTheme.spacing(1),
      gridAutoFlow: 'column',
      gridTemplateColumns: '1fr',

      [uiTheme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },

    ProfileActions_mod: {
      gridTemplateColumns: 'auto 1fr',
    },

    ProfileActions__group: {
      background: uiTheme.palette.neutral[900],
      padding: uiTheme.spacing(0.5),
      gridAutoFlow: 'column',
      borderRadius: '16px',
      display: 'grid',
      gap: uiTheme.spacing(0.5),

      '& svg': {
        width: '16px',
        height: '16px',
      },

      '& .MuiButtonBase-root': {
        fontSize: '12px',
      },
    },

    ProfileActions__button_square: {
      width: '36px',
    },

    // Do not have a flat variation anywhere els.e
    ProfileActions__button_flat: {
      boxShadow: 'none !important',
      padding: '9px !important',

      '& [id="button-text"]': {
        padding: '0px',
      },

      '&.MuiButton-containedSecondary': {
        background: `${uiTheme.palette.primary[500]} !important`,
      },

      '& > div:empty': {
        display: 'none',
      },

      '& .MuiTypography-root': {
        '&::before, &::after': {
          display: 'none',
        },
      },
    },

    ProfileActions__button_error: {
      fill: uiTheme.palette.error[500],
    },
  }),
)
