import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useActiveBannerStyles = makeStyles(theme =>
  createStyles({
    ActiveBanner: {
      height: 'fit-content',
      padding: `${theme.spacing(3)} ${theme.spacing(0)} ${theme.spacing(
        3,
      )} ${theme.spacing(3)}`,
    },

    ContentContainer: {
      display: 'flex',
      width: '100%',
      gap: theme.spacing(1.5),
      overflowX: 'clip',
    },

    ActiveChipProgress: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      paddingRight: theme.spacing(3),
    },

    ActiveChipProgressTextContainer: {
      display: 'flex',
      flexDirection: 'row',
    },

    ActiveBannerRightContainer: {
      display: 'flex',
      flexDirection: 'column',
      width: 'inherit',
      overflow: 'hidden',
      zIndex: 1,
    },
  }),
)
