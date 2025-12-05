import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { Calendar } from '@project-atl/ui/assets'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { createMoment } from 'app/util'

interface TableCalendarOverlayProps {
  calendarDate: Date
  header: string
  subheader: string
}

export const useTableCalendarOverlayStyles = makeStyles(theme =>
  createStyles({
    TableCalendarOverlay: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.75),
    },

    CalendarContainer: {
      position: 'relative',
      width: 'fit-content',
      height: '24px',
    },

    CalendarContainer__monthText: {
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },

    TableCalendarOverlay__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.25),
    },
  }),
)

export const TableCalendarOverlay: React.FC<TableCalendarOverlayProps> = ({
  calendarDate,
  header,
  subheader,
}) => {
  const classes = useTableCalendarOverlayStyles()

  return (
    <div className={classes.TableCalendarOverlay}>
      <div className={classes.CalendarContainer}>
        <Calendar iconFill={uiTheme.palette.common.white} />
        <Typography
          className={classes.CalendarContainer__monthText}
          fontSize="0.5rem"
          lineHeight="1rem"
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.common.white}
        >
          {createMoment(calendarDate).date()}
        </Typography>
      </div>
      <div className={classes.TableCalendarOverlay__textContainer}>
        <Typography
          variant="body1"
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.common.white}
        >
          {header}
        </Typography>
        <Typography
          variant="body3"
          fontWeight={uiTheme.typography.fontWeightMedium}
          color={uiTheme.palette.neutral[300]}
        >
          {subheader}
        </Typography>
      </div>
    </div>
  )
}
