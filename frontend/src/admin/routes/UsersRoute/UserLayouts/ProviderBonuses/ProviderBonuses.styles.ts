import makeStyles from '@mui/styles/makeStyles'

export const useProviderBonusesStyles = makeStyles(theme => ({
  ProviderBonuses: {
    overflowY: 'auto',
  },

  ProviderBonuses__title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
  },
}))
