import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAffiliateLinkStyles = makeStyles(() =>
  createStyles({
    AffiliateLink: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(3),
        padding: uiTheme.spacing(3.5),
      },
    },

    DialogCoverWithImageContainer: {
      display: 'flex',
      overflow: 'hidden',
      borderRadius: 12,
    },

    DialogCoverWithImageContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1),
        padding: uiTheme.spacing(5),
      },
    },

    DialogCoverWithImageContent__heading: {
      fontWeight: `${uiTheme.typography.fontWeightBlack} !important`,
      position: 'relative',
      marginBottom: uiTheme.spacing(0.75),
      textShadow: '0px 4px 0px rgba(65, 10, 155, 0.50)',
    },

    DialogCoverWithImageContentBody: {
      display: 'flex',
      flexDirection: 'column',
    },

    DialogCoverWithImageContentBody__body2__link: {
      color: uiTheme.palette.common.white,
      textDecoration: 'none',

      '&:hover': {
        color: uiTheme.palette.common.white,
        textDecoration: 'underline',
      },
    },

    DialogCoverWithImageContentBody__body2: {
      fontWeight: `${uiTheme.typography.fontWeightBold} !important`,
    },

    AffiliateLinkFields: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      gap: uiTheme.spacing(1.5),
      padding: uiTheme.spacing(1.5),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: 12,

      [uiTheme.breakpoints.up('md')]: {
        flexDirection: 'row',
        padding: 0,
        backgroundColor: 'transparent',
      },
    },

    AffiliateLinkFields__input: {
      '& .MuiOutlinedInput-input.Mui-disabled': {
        color: uiTheme.palette.common.white,
        WebkitTextFillColor: uiTheme.palette.common.white,
      },
    },

    CopyButton: {
      flexShrink: 0,
      alignSelf: 'end',
      height: '44px !important',
      // .MuiButtonBase-root has an outline of 0 by default
      outline: `4px solid ${uiTheme.palette.neutral[900]} !important`,

      [uiTheme.breakpoints.up('md')]: {
        width: 105,
      },
    },
  }),
)
