import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useKYCDateOfBirthInputStyles = makeStyles(() =>
  createStyles({
    KYCForm__DOBFieldGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'column',
    },

    KYCForm__DOBFields: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },
  }),
)
