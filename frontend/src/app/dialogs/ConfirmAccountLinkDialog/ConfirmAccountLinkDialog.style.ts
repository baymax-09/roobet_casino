import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface FormStyleProps {
  showPasswordText: boolean
}

const formStyles = theme =>
  createStyles({
    Form__passwordVisibilityButton: ({ showPasswordText }: FormStyleProps) => ({
      color: theme.palette.primary.light,

      '& span > svg > path': {
        color: showPasswordText
          ? uiTheme.palette.primary[500]
          : uiTheme.palette.neutral[300],
      },
      '&:hover > span > svg > path': {
        fill: uiTheme.palette.common.white,
      },
    }),
  })

export const useConfirmAccountLinkDialogStyles = makeStyles(theme =>
  createStyles({
    ...formStyles(theme),
    DialogContent__callToAction: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    },

    Header__mainText: {
      fontWeight: theme.typography.fontWeightBold,
    },

    CallToAction__innerContent: {
      width: '100%',
    },
  }),
)
