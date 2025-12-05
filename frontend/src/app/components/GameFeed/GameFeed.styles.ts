import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as UITheme } from '@project-atl/ui'

export const useGameFeedStyles = makeStyles(() =>
  createStyles({
    GameFeed: {
      padding: `0px ${UITheme.spacing(2)}`,

      [UITheme.breakpoints.up('md')]: {
        padding: `0px ${UITheme.spacing(3)}`,
      },
    },

    GameFeed__container: {
      maxWidth: UITheme.breakpoints.values.lg,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
    },

    GameFeed__tabs: {
      width: '100%',
      maxWidth: '100%',
      borderRadius: '12px 12px 0 0',
    },

    GameFeed__tab_gameImage: {
      height: '32px',
      minWidth: '32px',
      width: '32px',
      borderRadius: '4px',
      marginRight: UITheme.spacing(1),
      position: 'relative',
      overflow: 'hidden',

      '&:after': {
        display: 'none',
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        border: `2px solid ${UITheme.palette.common.white}`,
        borderRadius: '4px',
      },

      '&:hover:after': {
        display: 'block',
      },
    },

    GameFeed__tab_cell: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'inherit',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    GameFeed__tab_link: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      textDecoration: 'none',
      overflow: 'hidden',
      color: UITheme.palette.common.white,
    },

    GameFeed__tab_gameName: {
      textTransform: 'capitalize',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    GameFeed__tab_cell_right: {
      justifyContent: 'right',
    },

    GameFeed__tab_cell_center: {
      justifyContent: 'center',
    },

    GameFeed__tab_cell_icon: {
      width: '16px',
      marginRight: UITheme.spacing(1),

      '& *': {
        fill: UITheme.palette.neutral[500],
      },
    },

    GameFeed__tab_cell_user_hidden: {
      color: UITheme.palette.neutral[500],
    },

    GameFeed__tab_cell_won: {
      color: UITheme.palette.success[500],
    },

    GameFeed__tab_cell_zero: {
      color: UITheme.palette.neutral[500],
    },

    GameFeed__tab_currency: {
      width: '16px',
      marginLeft: UITheme.spacing(1),
    },

    '@keyframes slideOdd': {
      from: {
        transform: 'translateY(-100%)',
      },
    },

    '@keyframes slideEven': {
      from: {
        transform: 'translateY(-100%)',
      },
    },

    GameFeed__table: {
      width: '100%',

      '& tbody': {
        position: 'relative',

        // This adds a top padding to the table to make the rows of equal size for the
        // animation to work uniformly.
        '&:before': {
          content: '" "',
          display: 'block',
          height: UITheme.spacing(1),
        },
        '&:after': {
          content: '""',
          background: `linear-gradient(${UITheme.palette.neutral[800]}, transparent)`,
          height: '9px',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
        },
      },

      '& tbody > tr > td': {
        paddingBlock: UITheme.spacing(0.5),
      },

      '& tbody > tr:nth-child(even)': {
        animation: `0.5s ease-out 0s 1 normal none running $slideOdd`,
      },

      '& tbody > tr:nth-child(odd)': {
        animation: `0.5s ease-out 0s 1 normal none running $slideEven`,
      },

      '& table': {
        tableLayout: 'fixed',
        overflowAnchor: 'none',

        '& td': {
          textOverflow: 'ellipsis',
        },
      },

      '& .MuiTableContainer-root': {
        height: '500px',
        maxHeight: '500px',
        borderRadius: '0px',
        overflowY: 'hidden',
        position: 'relative',
        '&:after': {
          content: '""',
          background: `linear-gradient(transparent, ${UITheme.palette.neutral[800]})`,
          height: '72px',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
        },
      },

      '& .MuiPaper-root': {
        borderRadius: '0px',
      },

      // Fix with class name in package.
      '& div:has(.MuiPaper-root)': {
        borderRadius: '0 0 12px 12px',
      },
    },
  }),
)
