import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAdventRafflePageStyles = makeStyles(theme =>
  createStyles({
    AdventRafflePage__gameList: {
      paddingBottom: '0 !important',
      paddingTop: 50,
    },

    AdventRafflePage: {
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',
      padding: `${theme.spacing(3)} 0 0`,

      [uiTheme.breakpoints.up('md')]: {
        padding: `${theme.spacing(3)} ${theme.spacing(3)} 0`,
      },
    },

    AdventRafflePage__gridLayout: {
      display: 'flex',
      flexWrap: 'wrap',
      marginBottom: theme.spacing(3),

      [uiTheme.breakpoints.up('md')]: {
        display: 'grid',
        gap: 15,

        gridTemplateAreas: `
      "p1 info info info info"
      "p2 info info info info"
      "p3 p4 p5 p6 p7"
      "s2 s2 s2 s2 p8"
      "s2 s2 s2 s2 p9"
      "p14 p13 p12 p11 p10"
      "p15 s3 s3 s3 s3"
      "p16 s3 s3 s3 s3"
      "p17 p18 p19 p20 p21"
      "s4 s4 s4 s4 p22"
      ". . p25 p24 p23"
    `,
      },
    },

    HeaderSection__adventBannerContainer: {
      height: 260,
    },

    HeaderSection__details: {
      fontWeight: 500,
      margin: `${theme.spacing(3)} auto`,
      textAlign: 'center',
      padding: uiTheme.spacing(1),
      lineHeight: '19px',

      [uiTheme.breakpoints.up('md')]: {
        maxWidth: '90%',
      },
    },

    Details__moreInfoLink: {
      fontWeight: 600,
      color: 'white',
      opacity: 0.8,
    },

    GridLayout__imageSection: {
      display: 'none',

      [uiTheme.breakpoints.up('md')]: {
        display: 'block',
      },
    },

    GridLayout__headerSection: {
      flexShrink: 0,
      width: '100%',
    },
  }),
)
