import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDefaultRafflePageStyles = makeStyles(theme =>
  createStyles({
    RafflePage: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      background: uiTheme.palette.neutral[800],
      borderRadius: '12px',
      gap: uiTheme.spacing(2),
      color: uiTheme.palette.neutral[400],

      fontWeight: uiTheme.typography.fontWeightMedium,
      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
      },
    },

    RaffleBanner__backgroundWrapper: {
      height: '256px',
    },

    RafflePageHeader: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      width: '100%',

      [uiTheme.breakpoints.up('lg')]: {
        gap: uiTheme.spacing(2),
        flexDirection: 'row',
      },
    },

    RafflePageHeaderRightContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    RafflePageHeaderRightContainer__block: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
      backgroundColor: uiTheme.palette.neutral[700],
      padding: uiTheme.spacing(1.5),
      borderRadius: '12px',
      height: 'fit-content',
      width: '100%',

      [uiTheme.breakpoints.up('sm')]: {
        whiteSpace: 'nowrap',
      },

      [uiTheme.breakpoints.up('lg')]: {
        minWidth: '278px',
      },
    },

    RafflePageHeaderRightContainer__block__innerContent: {
      display: 'flex',
      gap: uiTheme.spacing(0.5),
    },

    RafflePage__section: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      position: 'relative',
      gap: uiTheme.spacing(1.5),
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    RafflePage__soundToggle: {
      margin: '10px 0px',
      display: 'flex',
    },

    SoundToggle__playAudio: {
      height: '34px',
      marginLeft: '5px',
    },

    OtherTermsContainer: {
      listStyleType: 'disc',
      paddingLeft: uiTheme.spacing(2),
      fontFamily: uiTheme.typography.fontFamily,
      fontSize: uiTheme.typography.body2.fontSize,
      lineHeight: uiTheme.typography.body2.lineHeight,

      '&:before': {
        top: 0,
        bottom: 0,
        right: 0,
        width: 30,
        opacity: '0.05',
      },

      '&:after': {
        top: 0,
        bottom: 0,
        right: 37,
        width: 18,
        opacity: '0.02',
      },

      [uiTheme.breakpoints.up('md')]: {
        fontSize: uiTheme.typography.body1.fontSize,
        lineHeight: uiTheme.typography.body1.lineHeight,
      },
    },

    Link: {
      '&:hover': {
        color: uiTheme.palette.neutral[300],
      },
    },

    Section__header: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative',

      fontWeight: theme.typography.fontWeightBold,
      lineHeight: '19px',

      '&:before': {
        position: 'absolute',
        content: '""',
        bottom: -3,
        left: 0,
        width: '60%',
        height: 3,
        background: theme.palette.secondary.main,
        borderRadius: 1,
      },

      '& > img': {
        height: 20,
        marginRight: 4,
      },
    },

    LogoWithMessage__logo: {
      position: 'relative',
      width: '100%',
      height: 70,
      marginTop: theme.spacing(1),

      [uiTheme.breakpoints.up('sm')]: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 120,
        zIndex: 5,
        height: '100%',
        padding: 0,
      },
    },

    Logo__image: {
      transition: '.3s ease',
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      zIndex: 10,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      filter: 'drop-shadow(0px 0px 20px rgba(255, 255, 255, 0.3))',

      [uiTheme.breakpoints.up('sm')]: {
        top: -20,
        right: -20,
        left: -20,
        bottom: -20,
      },
    },

    Section__body: {
      marginTop: theme.spacing(1),
      lineHeight: '19px',
    },

    Section__instructionHeaders: {
      marginTop: theme.spacing(2),
      width: '100%',

      [uiTheme.breakpoints.up('sm')]: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      },
      '& a': {
        color: theme.palette.secondary.main,
        marginLeft: 2,
        marginRight: 2,
      },
    },

    InstructionHeaders__header: {
      display: 'inline-block',
      padding: '3px 8px',
      marginRight: 8,

      '& p': {
        display: 'inline',
        fontWeight: 500,
      },
    },

    InstructionHeaders__number: {
      verticalAlign: 'middle',
      padding: '0px 7px',
      marginRight: theme.spacing(0.8),
      display: 'inline-block',
      background: theme.palette.primary.main,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 600,
      zIndex: 100,
      position: 'relative',
    },

    Leaderboard_winners: {
      gridTemplateColumns: '1fr !important',
    },

    Entry__payout: {
      display: 'flex',
      alignItems: 'center',

      fontWeight: theme.typography.fontWeightBold,

      '& > img': {
        height: 20,
        marginRight: 5,
      },
    },

    RafflePage__leaderboard: {
      position: 'relative',
      width: '100%',
      marginTop: theme.spacing(2),

      [uiTheme.breakpoints.up('sm')]: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      },

      '& > div': {
        position: 'relative',
        zIndex: 10,
      },
    },

    Leaderboard__entry: {
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      height: 40,
      padding: '0px 4px',

      '&:nth-child(odd)': {
        background: 'rgba(255, 255, 255, 0.03)',
      },
    },

    Entry_highlighted: {
      color: theme.palette.secondary.main,

      '& $Entry__winnerPlace': {
        background: theme.palette.secondary.main,
        color: theme.palette.primary.main,
      },
    },

    Entry__winnerPlace: {
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 8px',
      fontSize: 16,
      height: 20,
      borderRadius: 2,
      color: '#c5c5c5',
      background: '#333656',

      fontWeight: theme.typography.fontWeightBold,
      marginRight: 8,
      marginLeft: 8,
    },

    Entry__winnerName: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',

      fontWeight: theme.typography.fontWeightBold,
      fontSize: 15,
    },

    Entry__ticketImage: {
      height: 14,
      verticalAlign: 'middle',
      marginRight: 4,
    },

    RafflePage__raffleSection: {
      height: 150,
      marginTop: theme.spacing(4),
      marginBottom: theme.spacing(4),

      [uiTheme.breakpoints.up('sm')]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },

    RaffleSection__logoWithMessage: {
      width: '100%',
      position: 'relative',

      [uiTheme.breakpoints.up('sm')]: {
        height: 150,
        width: 150,
      },

      '& $LogoWithMessage__logo': {
        width: '100%',
        height: 150,
        [uiTheme.breakpoints.up('md')]: {
          height: 'initial',
        },
      },
    },

    LogoWithMessage__message: {
      flexDirection: 'column',
      marginLeft: theme.spacing(5),
      maxWidth: 300,
      display: 'none',

      '& > h5': {
        fontWeight: theme.typography.fontWeightBold,
      },

      '& > p': {
        marginBottom: theme.spacing(1),
        lineHeight: '19px',
      },
      [uiTheme.breakpoints.up('sm')]: {
        display: 'initial',
      },
    },

    Entry_faded: {
      opacity: 0.5,
    },

    Section__listStyle: {
      listStyle: 'circle',
      marginLeft: theme.spacing(2),
      '& li': {
        paddingTop: uiTheme.spacing(0.5),
      },
    },
  }),
)
