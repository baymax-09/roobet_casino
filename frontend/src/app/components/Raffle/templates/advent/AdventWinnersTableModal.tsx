import React from 'react'
import {
  Dialog,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Lottie from 'react-lottie'
import numeral from 'numeral'

import { useTranslate } from 'app/hooks'
import giftAnimationData from 'app/lottiefiles/test/9750-gift.json'

import { useAdventWinnersTableModalStyles } from './AdventWinnersTableModal.styles'

const HeaderAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: giftAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
}

interface AdventWinnersTableModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  raffle: {
    name: string
    winners: any[]
    payouts: any[]
  }
}

export const AdventWinnersTableModal: React.FC<
  AdventWinnersTableModalProps
> = props => {
  const classes = useAdventWinnersTableModalStyles()
  const translate = useTranslate()

  const { open, setOpen, raffle } = props

  const winners = raffle.winners || []
  const payouts = raffle.payouts || []

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      classes={{
        container: classes.AdventWinnersTable,
        paper: classes.AdventWinnersTable__paper,
      }}
    >
      <div className={classes.AdventWinnersTable__header}>
        <IconButton
          onClick={() => setOpen(false)}
          className={classes.Header__closeButton}
          size="large"
        >
          <CloseIcon />
        </IconButton>

        <div className={classes.Header__animation}>
          <div className={classes.Animation__lottie}>
            <Lottie options={HeaderAnimationOptions} height={120} width={120} />
          </div>
        </div>
        <div className={classes.Header__messsage}>
          <Typography
            variant="h2"
            color="deprecated.textPrimary"
            classes={{ h2: classes.Message__title }}
          >
            {translate('holidayWinnersTableModal.winners')}
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            classes={{ body1: classes.Message__subtitle }}
          >
            {raffle.name}
          </Typography>
        </div>
      </div>
      <TableContainer
        className={classes.AdventWinnersTable__tableContainer}
        component={Paper}
      >
        <Table
          className={classes.TableContainer__table}
          size="small"
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <TableCell>
                {translate('holidayWinnersTableModal.player')}
              </TableCell>
              <TableCell>
                # {translate('holidayWinnersTableModal.ofTickets')}
              </TableCell>
              <TableCell>
                {translate('holidayWinnersTableModal.amountWon')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {winners.map((winner, key) => (
              <TableRow key={key} className={classes.Table__row}>
                <TableCell>
                  {winner.user.name
                    ? winner.user.name
                    : translate('generic.hiddenName')}
                </TableCell>
                <TableCell>
                  {numeral(winner.tickets.tickets).format('0,0')}
                </TableCell>
                <TableCell>{payouts[key]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Dialog>
  )
}
