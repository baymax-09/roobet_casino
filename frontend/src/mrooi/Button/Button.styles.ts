import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

interface ButtonStyleProps {
  color: string
  textColor: string
  lightenColor: string
}

const button = ({ color, textColor, lightenColor }: ButtonStyleProps) => ({
  background: color,
  color: textColor,

  '&.outlined': {
    background: 'none',
    border: `2px solid ${color}`,
    color,

    '&:hover': {
      background: color,
      color: textColor,
    },

    '&:disabled': {
      opacity: 0.3,
      color,
      background: 'none',
    },
  },

  '&:not(:disabled):active': {
    background: lightenColor,
  },

  '&:disabled': {
    cursor: 'not-allowed',
    background: `rgba(${color}, 0.5)`,
    color: `rgba(${textColor}, 0.5)`,
  },
})

export const useButtonStyles = makeStyles(theme =>
  createStyles({
    button: {
      textDecoration: 'none',
      boxSizing: 'border-box',
      border: 'none',
      color: '#fff',
      height: 40,
      background: 'none',
      fontWeight: 500,
      fontSize: 16,
      padding: '0px 16px',
      borderRadius: 4,
      maxWidth: 'none',
      transition: '0.2s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',

      '&:active:focus': {
        outline: 'none',
        filter: 'brightness(0.9)',
        border: 'none',
      },

      '&.red': {
        ...button({
          color: theme.palette.red.main,
          textColor: '#fff',
          lightenColor: '#f76e64',
        }),
      },

      '&.yellow': {
        ...button({
          color: '#ffeb3b',
          textColor: '#16182f',
          lightenColor: '#fff170',
        }),
      },

      '&.light': {
        ...button({
          color: '#ddb43f',
          textColor: theme.palette.secondary.contrastText,
          lightenColor: '#e5c56c',
        }),
        fontSize: 14,
      },

      '&.lightPurple': {
        ...button({
          color: '#7174b3',
          textColor: '#fff',
          lightenColor: '#9294c4',
        }),
      },

      '&.white': {
        ...button({
          color: '#fff',
          textColor: '#16182f',
          lightenColor: '#fff',
        }),
      },

      '&.modifierButton': {
        ...button({
          color: '#2a2b48',
          textColor: '#d4d5e0',
          lightenColor: '#3c3e67',
        }),
        position: 'relative',
        padding: '0px 15px',
        borderRadius: 0,
        fontSize: 14,

        '&:not(:last-child):after': {
          position: 'absolute',
          top: 'calc(50% - 20%)',
          right: 0,
          height: '40%',
          width: 2,
          background: '#393a59',
          content: '" "',
        },

        '&:hover': {
          background: '#2f3050',
        },

        '&.active': {
          color: '#d9dbfd',
          background: '#3d3e64',
        },
      },

      '&.darkPurple': {
        ...button({
          color: '#303255',
          textColor: '#fff',
          lightenColor: '#393a59',
        }),
      },

      '&.green': {
        ...button({
          color: '#4caf50',
          textColor: '#16182f',
          lightenColor: '#6ebf70',
        }),
      },

      '&.lightSuffix': {
        ...button({
          color: 'transparent',
          textColor: theme.palette.gray.dark,
          lightenColor: 'transparent',
        }),
        '&:active': {
          transform: 'scale(0.9)',
        },
      },

      '&.transparent': {
        ...button({
          color: 'transparent',
          textColor: '#fff',
          lightenColor: 'transparent',
        }),
      },

      '&.gameSetting': {
        color: '#6e7693',
        fontWeight: 500,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        border: 'solid 1px #6e7693',
        height: 34,

        '&:active': {
          color: '#626984',
          borderColor: '#626984',
        },

        '&:hover': {
          background: 'transparent',
        },

        '& > svg': {
          marginRight: 8,
          boxSizing: 'border-box',
        },
      },

      '& > svg': {
        marginRight: 2,
      },
    },
  }),
)
