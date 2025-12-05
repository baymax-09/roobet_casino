import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { env } from 'common/constants'

export const useGameListViewStyles = makeStyles(theme =>
  createStyles({
    GameListView: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(2),
      height: '100%',
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(3),
      },
    },

    GameList_preview: {
      paddingBottom: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        paddingBottom: uiTheme.spacing(3),
      },
    },

    GameList__gameTitle: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },

    GameList_empty: {
      paddingTop: uiTheme.spacing(6),
      paddingBottom: uiTheme.spacing(2),
    },

    GameList_slides: {
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns:
        'calc((100% - (var(--roo-game-thumbnail-gap) * (var(--roo-game-thumbnail-per-column) - 1))) / var(--roo-game-thumbnail-per-column))',
      gap: 'var(--roo-game-thumbnail-gap)',
    },

    GameList_slide: {
      width: '100%',
      marginRight: 'auto !important',
    },

    GameList__games: {
      display: 'grid',
      gridTemplateColumns: 'repeat(var(--roo-game-thumbnail-per-column), 1fr)',
      gap: 'var(--roo-game-thumbnail-gap)',
    },

    GameList__actions: {
      display: 'flex',
      justifyContent: 'center',
      paddingTop: uiTheme.spacing(3),
      paddingBottom: uiTheme.spacing(3),
    },

    GameTitle__wrapper: {
      flex: '1 1 0%',
      display: 'flex',
      alignItems: 'center',

      '& * ': {
        ...(env.SEASONAL === 'true' && {
          fontFamily: "'Black And White Picture' !important",
        }),
      },
    },

    ViewAllButton: {
      marginLeft: 'auto',
    },

    GameList__collateContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    GameList__collate: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'right',
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },

      [uiTheme.breakpoints.up('lg')]: {
        flexDirection: 'row',
      },
    },

    GameList__collate__sortAndFilter: {
      display: 'flex',
      gap: uiTheme.spacing(1),
      order: 3,

      '& > div': {
        minWidth: '0',

        [uiTheme.breakpoints.up('md')]: {
          minWidth: 'auto',
        },
      },
    },

    Tag_linkDecoration: {
      textDecoration: 'none',
      width: '100%',
    },

    Collate__lucky: {
      marginRight: 'auto',
      marginLeft: 0,
      background: '#544f8f',
      borderRadius: '5px',
      boxShadow: '0px 2px 4px rgb(20 18 43 / 60%)',
      '&:hover': {
        background: '#544f8f',
      },
    },

    Collate__searchContainer: {
      display: 'flex',
      flexGrow: 1,
      gap: theme.spacing(1),
      order: 1,
    },

    Collate__close: {
      width: '40px !important',
      height: '40px !important',
      padding: 0,
      backgroundColor: `${uiTheme.palette.neutral[800]} !important`,
      order: 2,

      '&:hover': {
        backgroundColor: `${uiTheme.palette.neutral[700]} !important`,
      },

      [uiTheme.breakpoints.up('lg')]: {
        order: 4,
      },
    },
  }),
)
