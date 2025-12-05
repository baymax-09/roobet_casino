import createStyles from '@mui/styles/createStyles'

export const textFieldStyles = theme =>
  createStyles({
    prefix: {},
    suffix: {},
    readOnly: {},
    centered: {},
    info: {},
    disabled: {},

    textField: {
      '&$disabled': {
        '$controlContainer, input': {
          cursor: 'not-allowed',
        },
      },
    },

    light: {
      '& $controlContainer': {
        background: '#f5f4f4',
        border: 'solid 1px #d8d4ca',

        '& $prefix, & $suffix': {
          color: theme.palette.gray.dark,
        },
      },

      '& $label': {
        color: theme.palette.gray.dark,
      },

      '& $inputControl': {
        color: theme.palette.gray.dark,
        fontWeight: 400,
        '&::-webkit-input-placeholder': {
          color: theme.palette.gray.dark,
        },
        '&:-moz-placeholder': {
          color: theme.palette.gray.dark,
        },
        '&::-moz-placeholder': {
          color: theme.palette.gray.dark,
        },
        '&:-ms-input-placeholder': {
          color: theme.palette.gray.dark,
        },
      },
    },

    label: {
      display: 'block',
      color: '#797b95',
      fontWeight: 500,
      fontSize: '12px',
      marginBottom: '5px',
      userSelect: 'none',

      '& $info': {
        fontSize: '10px',
        marginLeft: '3px',
        position: 'relative',
      },
    },

    controlContainer: {
      display: 'flex',
      overflow: 'hidden',
      background: '#3e3e65',
      borderRadius: 4,

      '& $prefix, & $suffix': {
        flexShrink: 0,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        width: 40,
      },

      '& $prefix': {
        fontSize: '22px',
        marginRight: '-10px',
      },

      '& $suffix': {
        color: '#8b8bac',
        fontSize: '14px',
      },
    },

    inputControl: {
      flex: 1,
      display: 'block',
      border: 'none',
      width: '100%',
      height: 40,
      boxSizing: 'border-box',
      margin: 0,
      outline: 'none',
      background: 'none',
      color: '#fff',
      fontSize: 14,
      fontWeight: 500,
      padding: '0 10px',
      overflow: 'hidden',

      '&$disabled': {
        color: '#6e6f8d',
      },

      '&::-webkit-input-placeholder': {
        color: 'rgba(255, 255, 255, 0.3)',
      },
      '&:-moz-placeholder': {
        color: 'rgba(255, 255, 255, 0.3)',
      },
      '&::-moz-placeholder': {
        color: 'rgba(255, 255, 255, 0.3)',
      },
      '&:-ms-input-placeholder': {
        color: 'rgba(255, 255, 255, 0.3)',
      },

      '& $centered &': {
        textAlign: 'center',
      },
    },
  })
