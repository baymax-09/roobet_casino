/* eslint-disable no-multi-str */
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

const useGlobalStyles = makeStyles(theme =>
  createStyles({
    '@global': {
      '*': {
        fontFamily: '"Excon", "Roboto", "sans-serif !important"',
      },

      '*, *::before, *::after': {
        boxSizing: 'inherit',
      },

      hr: {
        border: 'none',
        borderTop: 'solid 1px #dddcd5',
      },

      'input, textarea, button, select, span, div, a': {
        '-webkit-tap-highlight-color': 'rgba(0, 0, 0, 0)',
      },

      html: {
        boxSizing: 'border-box',
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
      },

      table: {
        borderCollapse: 'collapse',
        borderSpacing: 0,
      },

      'html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, \
    pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, \
    small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, \
    fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, \
    aside, canvas, details, embed, figure, figcaption, footer, header, hgroup, menu, nav, \
    output, ruby, section, summary, time, mark, audio, video': {
        margin: 0,
        padding: 0,
        border: 0,
        fontSize: '100%',
        font: 'inherit',
        verticalAlign: 'baseline',
      },

      'article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section':
        {
          display: 'block',
        },

      body: {
        overflow: 'hidden',
        lineHeight: 1.43,
        color: theme.palette.gray.dark,
        margin: 0,
        fontSize: '0.875rem',
        fontFamily:
          '"Excon", "Roboto", "Helvetica", "Arial", "sans-serif !important"',
        fontWeight: 400,
        letterSpacing: '0.01071em',
        background: theme.palette.background.default,

        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },

      'ol, ul': {
        listStyle: 'none',
      },

      'blockquote, q': {
        quotes: 'none',

        '&::before': {
          content: '',
        },

        '&::after': {
          content: '',
        },
      },

      'strong, b': {
        fontWeight: theme.typography.fontWeightBold,
      },

      button: {
        cursor: 'pointer',
      },

      '#paymentiq-cashier': {
        display: 'none',
      },

      // react-tooltip
      '.tooltip': {
        fontSize: 13,
        fontWeight: theme.typography.fontWeightRegular,
        padding: '5px 10px',
      },

      '#modalRoot': {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        overflow: 'hidden',
      },

      '.grecaptcha-badge': {
        display: 'none !important',
      },

      '.pac-container': {
        zIndex: 1500,
      },
    },
  }),
)

export const GlobalStyles = () => {
  useGlobalStyles()
  return null
}
