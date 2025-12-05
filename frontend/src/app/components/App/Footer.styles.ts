import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useFooterStyles = makeStyles(theme =>
  createStyles({
    Footer: {
      padding: uiTheme.spacing(2),
      background: uiTheme.palette.neutral[900],

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    Footer__container: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(3),
      width: '100%',
      margin: '0 auto',
      maxWidth: uiTheme.breakpoints.values.lg,

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(4),
      },
    },

    FooterTopContainer: {
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      gap: uiTheme.spacing(3),

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        gap: 0,
        flexWrap: 'nowrap',
      },
    },

    LinkContainer__linkList: {
      ...theme.typography.body1,
      flexGrow: 1,
    },

    LinkContainer__linkList_noFlexGrow: {
      flexGrow: 0,
    },

    CategoryTitle: {
      marginBottom: uiTheme.spacing(1.5),
    },

    AcceptedCurrenciesAndLanguageContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(3),

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        gap: uiTheme.spacing(4),
      },
    },

    AcceptedCurrencies: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: uiTheme.spacing(2),
    },

    AcceptedCurrencies__icon: {
      width: 16,
      height: 16,
    },

    LanguageSelectorContainer: {
      flexGrow: 1,

      [uiTheme.breakpoints.up('md')]: {
        width: 151,
        alignSelf: 'start',
      },
    },

    LanguageSelector: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'start',
      gap: uiTheme.spacing(1),
    },

    LanguageSelector__selectedLanguage: {
      fontWeight: theme.typography.fontWeightMedium,
      color: uiTheme.palette.neutral[300],
      // TODO: Change to body3 once using MUI V5
      fontSize: '0.875rem',
      lineHeight: '1.42',
    },

    PartnerContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: uiTheme.spacing(2),

      '& > *': {
        alignItems: 'center',
        height: 96,

        [uiTheme.breakpoints.up('md')]: {
          marginBottom: 0,
        },
      },
    },

    AwardsAndLicensesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(3),

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        gap: uiTheme.spacing(5),
      },
    },

    AwardContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: uiTheme.spacing(2),
      minHeight: 'fit-content',
    },

    AwardContainer__awardIcon: {
      width: 123,
      height: 64,

      [uiTheme.breakpoints.up('md')]: {
        width: 164,
        height: 80,
      },
    },

    LicenseIcon: {
      '& > div': {
        height: 64,

        [uiTheme.breakpoints.up('md')]: {
          height: 80,
        },
      },
    },

    Divider: {
      height: 2,
      backgroundColor: uiTheme.palette.neutral[800],
      border: 'none',
    },

    LegalContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: uiTheme.spacing(2),
    },

    LegalContainer__roobetLogo: {
      width: 123,
      height: 32,
    },

    LegalContainer__rightContent: {
      display: 'flex',
      flexDirection: 'column',
      width: 'fit-content',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    LegalContainer__legalText: {
      color: uiTheme.palette.neutral[400],
      lineHeight: '1.66rem',
    },
  }),
)
