import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBonusCodeTemplateStyles = makeStyles(() =>
  createStyles({
    BonusCodeTemplateForm: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 10,
      width: '100%',
    },

    BonusCodeTemplateForm__formContainer: {
      padding: 10,
      margin: 'auto',
      width: '75%',
    },

    BonusCodeTemplateForm__title: {
      marginTop: 10,
      marginLeft: 10,
      textAlign: 'center',
    },

    BonusCodeTemplateForm__form: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: '0px 10px 10px 10px',
      '& > *': {
        margin: '8px 0',
      },
    },

    BonusCodeTemplateForm__bonusTypeInputLabel: {
      marginTop: 10,
    },

    BonusCodeTemplateForm__formSections: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '32%',
    },

    BonusCodeTemplateForm__formButtons: {
      display: 'flex',
      alignSelf: 'flex-end',
      marginTop: 10,

      '& button': {
        marginRight: 6,
      },
    },
  }),
)
