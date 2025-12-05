import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGamesFromCategoryStyles = makeStyles(theme =>
  createStyles({
    List__root: {
      width: '100%',
      padding: `0px ${theme.spacing(1.875)}`,
    },

    List__gameListRow: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      marginBottom: theme.spacing(0.625),
      alignItems: 'center',
      height: 40,
      justifyContent: 'space-between',
      padding: theme.spacing(0.875),
    },

    List__categorizedGames: {
      border: '1px solid #ffffff',
      marginTop: theme.spacing(0.625),
    },

    Dropdown__gameAmount: {
      padding: theme.spacing(0.625),
      display: 'flex',
      justifyContent: 'flex-start',
    },
  }),
)
