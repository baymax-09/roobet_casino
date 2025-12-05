import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useWinnersTableStyles = makeStyles(() =>
  createStyles({
    WinnersTable: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },

    WinnersTableIcon__coinBottom: {
      position: 'absolute',
      zIndex: 1,
      bottom: -36,
      right: 65,
      width: '52px',
    },

    WinnersTableIcon__coinLeft: {
      position: 'absolute',
      zIndex: 1,
      left: -44,
      bottom: 90,
      width: '76px',
    },

    WinnersTableIcon__coinRight: {
      position: 'absolute',
      zIndex: 1,
      right: -36,
      top: 120,
      width: '56px',
    },

    WinnersTable__tableContainer: {
      position: 'relative',
      display: 'flex',
      borderRadius: '12px',
      flexDirection: 'column',
      width: '100%',
      overflow: 'hidden',
    },

    WinnersTable__cell_neutral: {
      display: 'flex',
      alignItems: 'center',
      gap: uiTheme.spacing(1),
      color: uiTheme.palette.neutral[500],
    },

    WinnersTable__cell_ticket: {
      display: 'flex',
      alignItems: 'center',
      gap: uiTheme.spacing(1),
      color: uiTheme.palette.secondary[500],
    },

    WinnersTable__cell_prizeAmount: {
      color: uiTheme.palette.success[500],
      textAlign: 'end',
    },

    DrawingOfWinnersContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.75),
    },

    CalendarContainer: {
      position: 'relative',
      width: 'fit-content',
      height: '24px',
    },

    CalendarContainer__monthText: {
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },

    DrawingOfWinnersContainer__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.25),
    },
  }),
)
