import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDashboardRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      padding: theme.spacing(2),
    },

    quickLook: {
      margin: '10px 0',
    },

    jsonView: {
      marginTop: 5,
    },

    chart: {
      width: '100%',
      height: 300,
      maxWidth: 800,

      [theme.breakpoints.up('md')]: {
        height: 400,
      },

      '& canvas': {
        width: '100%',
        height: 300,
        maxWidth: 800,

        [theme.breakpoints.up('md')]: {
          height: 400,
        },
      },
    },

    configContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },

    selectContainer: {
      maxWidth: 250,
      margin: '8px 0',

      [theme.breakpoints.up('md')]: {
        maxWidth: 460,
      },
    },

    refreshButtonContainer: {
      width: '100%',
      margin: '16px 0',
      marginTop: 0,
      marginBottom: 0,
    },
  }),
)

export const colorArray = [
  '#FF6633',
  '#FFB399',
  '#FF33FF',
  '#FFFF99',
  '#00B3E6',
  '#E6B333',
  '#3366E6',
  '#999966',
  '#99FF99',
  '#B34D4D',
  '#80B300',
  '#809900',
  '#E6B3B3',
  '#6680B3',
  '#66991A',
  '#FF99E6',
  '#CCFF1A',
  '#FF1A66',
  '#E6331A',
  '#33FFCC',
  '#66994D',
  '#B366CC',
  '#4D8000',
  '#B33300',
  '#CC80CC',
  '#66664D',
  '#991AFF',
  '#E666FF',
  '#4DB3FF',
  '#1AB399',
  '#E666B3',
  '#33991A',
  '#CC9999',
  '#B3B31A',
  '#00E680',
  '#4D8066',
  '#809980',
  '#E6FF80',
  '#1AFF33',
  '#999933',
  '#FF3380',
  '#CCCC00',
  '#66E64D',
  '#4D80CC',
  '#9900B3',
  '#E64D66',
  '#4DB380',
  '#FF4D4D',
  '#99E6E6',
  '#6666FF',
]
