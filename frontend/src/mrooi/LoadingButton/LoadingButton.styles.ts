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

export const useLoadingButtonStyles = makeStyles(theme =>
  createStyles({
    LoadingButton: {
      border: 'none',
      borderRadius: 3,
      fontSize: 16,
      fontWeight: 500,
      height: 40,
      padding: '0px 10px',
      width: '50%',
      ...button({
        color: '#7174b3',
        textColor: '#fff',
        lightenColor: '#9294c4',
      }),

      '&:active:focus': {
        outline: 'none',
        filter: 'brightness(0.9)',
        border: 'none',
      },
    },
  }),
)
