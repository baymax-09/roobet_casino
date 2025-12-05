import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useKycFormsStyles = makeStyles(theme =>
  createStyles({
    KYCForm: {
      width: '100%',
      minHeight: '620px',
    },

    KYCForm__actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: theme.spacing(2),
      marginLeft: 'auto',
    },

    KYCForm__loading: {
      position: 'relative',
      margin: '0rem 1rem 1rem',
    },

    // Do not remove.
    DOBFieldGroup__DOBField: {},

    KYCForm__DOBFieldGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',

      '& > label': {
        marginBottom: theme.spacing(1),
        width: '100%',
      },

      '& > $DOBFieldGroup__DOBField': {
        width: '33.3%',
        padding: `0 ${theme.spacing(1)} 0 0`,

        '&:last-of-type': {
          padding: '0',
        },

        '& > div': {
          width: '100%',
        },
      },
    },

    SaveButtonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      width: '100%',
    },

    SaveButton: {
      [uiTheme.breakpoints.up('md')]: {
        width: '128px',
      },
    },
  }),
)
