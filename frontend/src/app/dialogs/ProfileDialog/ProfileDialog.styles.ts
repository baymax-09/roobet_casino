import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useProfileDialogStyles = makeStyles(() =>
  createStyles({
    ProfileDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '608px',
        },
      },
    },

    // Do not remove.
    ProfileDialog_self: {},

    ProfileDialog__block: {
      height: '100%',
      flexDirection: 'row',
      gap: 0,
    },

    ProfileDialog__info: {
      position: 'relative',
      display: 'grid',
      gap: '16px',
      gridTemplateAreas: `
        "stats"
        "roowards"
        "statsMore"
      `,

      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: `24px 28px 28px`,
        gap: '12px',
        gridTemplateAreas: `
          "statsMore statsMore"
          "stats roowards"
        `,
        gridTemplateColumns: '1.25fr 1.75fr',
      },
    },

    ProfileDialog__info_hidden: {
      zIndex: 1001,
      position: 'absolute',
      height: '100%',
      width: '156px',
      left: '0',
      right: '0',
      margin: '0 auto',
      textAlign: 'center',
      color: uiTheme.palette.neutral[300],
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',

      '& h6': {
        color: uiTheme.palette.common.white,
        fontSize: '16px',
        lineHeight: '20x',
        fontWeight: uiTheme.typography.fontWeightBold,
      },
    },

    ProfileDialog__info_blur: {
      '&:after': {
        background: 'rgba(9, 12, 29, 0.75)',
        content: '""',
        position: 'absolute',
        right: 0,
        bottom: 0,
        left: 0,
        top: 0,
        backdropFilter: 'blur(8px)',
        zIndex: 1000,

        [uiTheme.breakpoints.up('md')]: {
          background: 'rgba(25, 25, 57, 0.75)',
        },
      },
    },

    ProfileDialog__head: {
      padding: uiTheme.spacing(2),
      paddingBottom: 0,

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        paddingBottom: 0,
      },
    },

    ProfileDialog__section_header: {
      display: 'grid',
      gap: '12px',
      gridTemplateAreas: `
        "name copy"
        "actions actions"
      `,

      '$ProfileDialog_self &': {
        gridTemplateAreas: `
          "name copy"
        `,
      },

      [uiTheme.breakpoints.up('md')]: {
        display: 'flex',
        gap: '8px',
        padding: 0,
        background: 'transparent',
      },
    },

    ProfileDialog__section_stats: {
      gridArea: 'stats',
    },

    ProfileDialog__section_statsMore: {
      gridArea: 'statsMore',
    },

    ProfileDialog__section_roowards: {
      gridArea: 'roowards',
    },

    ProfileDialog__name: {
      gridArea: 'name',
      fontSize: '12px',

      '& h3': {
        fontSize: '22px',
        lineHeight: '28px',
        fontWeight: uiTheme.typography.fontWeightBold,
        // Collision with old v4 theme requires this family override.
        fontFamily: 'inherit',
      },
    },

    ProfileDialog__joined: {
      color: uiTheme.palette.neutral[300],
      fontWeight: uiTheme.typography.fontWeightMedium,

      '& strong': {
        color: uiTheme.palette.common.white,
      },
    },

    ProfileDialog__copy: {
      gridArea: 'copy',
      marginLeft: 'auto',
    },

    ProfileDialog__actions: {
      gridArea: 'actions',
    },

    ProfileDialog__roowards_levels: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        marginTop: 0,
      },
    },

    ProfileDialog__roowards_level: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontSize: '11px',
      fontWeight: uiTheme.typography.fontWeightBold,
    },

    ProfileDialog__roowards_progress: {
      width: '88px',
      height: '88px',
      marginBottom: uiTheme.spacing(1),
    },
  }),
)
