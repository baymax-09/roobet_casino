import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface StyleProps {
  snoopImage: RoobetAssetPath<'png'>
}

export const useVIPRouteStyles = makeStyles(
  theme =>
    createStyles({
      VIPRoute: {
        padding: uiTheme.spacing(2),

        [uiTheme.breakpoints.up('md')]: {
          padding: uiTheme.spacing(3),
        },
      },

      VIPRouteContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: uiTheme.breakpoints.values.lg,
        margin: `0 auto`,
        gap: uiTheme.spacing(3),
      },

      VIPRouteMainContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        textAlign: 'center',
        backgroundColor: uiTheme.palette.neutral[800],
        borderRadius: '12px',
        padding: uiTheme.spacing(2),
        gap: uiTheme.spacing(2),

        [uiTheme.breakpoints.up('md')]: {
          gap: uiTheme.spacing(3),
          padding: uiTheme.spacing(3.5),
        },
      },

      ButtonContainer: {
        zIndex: 2,
      },

      PlayNowButton: {
        width: '8rem',
      },

      LoginButtonContainer: {
        width: '268px',
      },

      Section: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
      },

      VIPClubMembership: {
        maxWidth: '786px',
      },

      Coin: {
        position: 'absolute',
      },

      Coin__topLeft: {
        position: 'absolute',
        top: 20,
        left: -32,
        width: '60px',

        [uiTheme.breakpoints.up('md')]: {
          left: 40,
          width: '72px',
        },
      },

      Coin__middleLeft: {
        position: 'absolute',
        left: -60,
        top: 200,
        width: '70px',
      },

      Coin__bottomLeft: {
        position: 'absolute',
        left: 0,
        bottom: 125,
        width: '48px',
      },

      Coin__topRight: {
        position: 'absolute',
        top: 100,
        right: 20,
        width: '61px',
      },

      Coin__bottomRight: {
        right: -27,
        bottom: 168,
        width: '50px',

        [uiTheme.breakpoints.up('md')]: {
          width: '72px',
          bottom: 102,
          right: -40,
        },
      },

      VIPClubInvitation: {
        maxWidth: '728px',
      },

      SnoopContainer: {
        position: 'relative',
        height: 311,
        display: 'flex',
        width: '100%',
        maxWidth: 636,

        [uiTheme.breakpoints.up('lg')]: {
          height: 357,
        },
      },

      SnoopVideo: {
        position: 'relative',
        width: '100%',
        height: 311,
        borderRadius: '12px',
        maxWidth: 636,

        [uiTheme.breakpoints.up('lg')]: {
          height: 357,
        },
      },

      PokerChip: {
        position: 'absolute',
      },

      PokerChip__right: {
        width: '100px',
        right: -32,
        top: 48,

        [uiTheme.breakpoints.up('md')]: {
          right: -54,
          top: 25,
          width: '90px',
        },

        [uiTheme.breakpoints.up('lg')]: {
          width: '143px',
          right: -72,
        },
      },

      PokerChip__bottom: {
        width: '70px',
        bottom: -29,
        right: 47,

        [uiTheme.breakpoints.up('md')]: {
          bottom: -24,
          right: 100,
          width: '90px',
        },
      },

      PokerChip__left: {
        left: -38,
        top: 160,
        width: '68px',

        [uiTheme.breakpoints.up('md')]: {
          top: 194,
          left: -50,
        },

        [uiTheme.breakpoints.up('lg')]: {
          top: 210,
          width: '80px',
        },
      },

      CrownImage: {
        width: '342px',
        height: '264px',
        display: 'block',

        [uiTheme.breakpoints.up('lg')]: {
          width: '384px',
          height: '296px',
        },
      },

      BenefitsContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: uiTheme.spacing(1.5),
        width: '100%',

        [uiTheme.breakpoints.up('md')]: {
          gap: uiTheme.spacing(2),
        },

        [uiTheme.breakpoints.up('lg')]: {
          gridTemplateColumns: 'repeat(3, 1fr)',
        },
      },

      Benefit: {
        display: 'flex',
        flexDirection: 'column',
        padding: uiTheme.spacing(2),
        backgroundColor: uiTheme.palette.neutral[700],
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        gap: uiTheme.spacing(1.5),

        [uiTheme.breakpoints.up('md')]: {
          padding: uiTheme.spacing(3.5),
          gap: uiTheme.spacing(2),
        },
      },

      Benefit__textContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: uiTheme.spacing(0.5),
      },

      FeaturesContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: uiTheme.spacing(2),
        width: '100%',
      },

      Feature: {
        display: 'flex',
        borderRadius: '12px',
        backgroundColor: uiTheme.palette.neutral[700],
        padding: uiTheme.spacing(2),

        [uiTheme.breakpoints.up('md')]: {
          padding: uiTheme.spacing(3.5),
        },
      },

      Feature__topContainer: {
        display: 'flex',
        gap: uiTheme.spacing(1),
      },

      Feature__textContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'baseline',
        gap: uiTheme.spacing(0.5),

        [uiTheme.breakpoints.up('md')]: {
          gap: uiTheme.spacing(0.75),
        },
      },
    }),
  {
    name: 'VIPRoute',
  },
)
