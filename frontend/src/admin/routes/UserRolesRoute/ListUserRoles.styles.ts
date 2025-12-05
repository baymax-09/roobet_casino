import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useUsersRouteStyles = makeStyles(theme =>
  createStyles({
    UserRolesList_paddingBot: {
      paddingBottom: theme.spacing(1),
    },

    UserRolesUserList__chip: {
      margin: `${theme.spacing(0.3125)} ${theme.spacing(0.625)} ${theme.spacing(
        0.3125,
      )} 0px`,
    },
  }),
)
