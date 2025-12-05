import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface CurrencyDisplayFormStylesProps {
  checked?: boolean
}

export const useCurrencyDisplayFormStyles = makeStyles(() =>
  createStyles({
    CurrencyDisplayForm__radioGroup: {
      maxWidth: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(93px, 1fr))',
      gap: '1rem',

      [uiTheme.breakpoints.up('md')]: {
        gridTemplateColumns: 'repeat(4, minmax(100px, 1fr))',
      },
    },

    CurrencyLabel__pill: ({ checked }: CurrencyDisplayFormStylesProps) => ({
      borderRadius: '12px',
      backgroundColor: uiTheme.palette.neutral[800],
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      border: checked ? `2px solid ${uiTheme.palette.primary[500]}` : 'none',
      width: 114,
      height: 48,

      [uiTheme.breakpoints.up(350)]: {
        width: 93,
      },

      [uiTheme.breakpoints.up(420)]: {
        width: 100,
        height: 56,
      },
    }),

    CurrencyLabel__symbolIcon: {
      width: 24,
      height: 24,

      [uiTheme.breakpoints.up('md')]: {
        width: 32,
        height: 32,
      },
    },

    CurrencyLabel__currency: {
      paddingLeft: uiTheme.spacing(1),
    },

    RadioGroup__radio: {
      margin: 'unset',
      padding: 'unset',
    },
  }),
)
