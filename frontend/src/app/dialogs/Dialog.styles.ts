import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { theme } from 'common/theme'

interface FormLabelProps {
  color?: string
}

export const useCommonDialogStyles = makeStyles(() =>
  createStyles({
    // @ts-expect-error TODO AFTER MUI5-UPGRADE merge theme.
    formLabel: ({ color = theme.palette.gray.dark }: FormLabelProps) => ({
      fontWeight: 500,
      fontSize: 14,
      marginRight: 10,
      color,
      display: 'block',
      marginBottom: 5,
    }),

    formTextInput: {
      boxsizing: 'border-box',
      '-moz-box-sizing': 'border-box',
      padding: 10,
      fontSize: 14,
      border: 'solid 1px #d8d4ca',
      width: '100%',
      display: 'block',
      borderRadius: 3,
      backgroundColor: '#f5f4f4',
      outlineWidth: 0,
      color: '#5a5a5a',
      marginBottom: 15,
      position: 'relative',
    },
  }),
)
