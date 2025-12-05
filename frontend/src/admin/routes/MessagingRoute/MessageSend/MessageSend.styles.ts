import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useMessageSentStyles = makeStyles(theme =>
  createStyles({
    preview: {
      width: '365px',
      borderRadius: '16px',
      overflow: 'hidden',
    },

    section: {
      marginBottom: theme.spacing(4),

      '& .MuiTypography-h5': {
        fontWeight: '600',
        fontSize: '24px',
        marginBottom: theme.spacing(2),
      },
    },

    recipients: {
      '& .MuiAccordion-root': {
        margin: `${theme.spacing(2)} 0 !important`,
      },

      '& .MuiAccordionSummary-root': {
        flexDirection: 'row-reverse',
        paddingLeft: 0,
        paddingRight: 0,
      },

      '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
      },

      '& .MuiList-root': {
        width: '100%',
        height: '200px',
        overflowY: 'auto',
      },
    },

    sendAtRadio: {
      flexDirection: 'row',
    },

    sendAtDate: {
      margin: `${theme.spacing(2)} 0 0`,

      '& .MuiInputBase-root': {
        marginBottom: '0',
      },
    },
  }),
)
