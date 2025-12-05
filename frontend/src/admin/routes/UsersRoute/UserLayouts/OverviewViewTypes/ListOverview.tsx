import React from 'react'
import { List, ListItem, Typography, Button } from '@mui/material'
import numeral from 'numeral'
import moment from 'moment'
import { useQuery, useMutation } from '@apollo/client'

import { useConfirm } from 'common/hooks'
import { ToggleUserViews } from 'admin/routes/UsersRoute/Dialogs/ActionsDialog/ToggleUserViews'
import { CreditRaffleTicketsMutation, UserQuery } from 'admin/gql'
import { type BalanceType, balanceTypeToFullname } from 'common/types'
import { withRulesAccessController } from 'admin/components'
import { type RoowardTimespan } from 'app/types/roowards'

import BalanceListItem from './BalanceListItem'
import { type UserData } from '../../types'
import { type BalanceChangeType } from './balanceChanges'

import { useListOverviewStyles } from './ListOverview.styles'

interface ListOverviewProps {
  userData: UserData
  updateUserData: (userData: UserData) => void
  modifyBalance: (
    balanceType: BalanceType,
    changeType: BalanceChangeType,
  ) => void
  busy: boolean
  setBusy: (busy: boolean) => void
  editAffiliate: () => void
  clearAffiliate: () => void
  editRoowardLevel: (args: { rewardType: RoowardTimespan }) => void
  editCxdAffiliate: () => void
  editCxd: () => void
}

const UpdateRoowardsButton = withRulesAccessController(
  ['roowards:update'],
  Button,
)
const UpdateAffiliateButton = withRulesAccessController(
  ['account:update_affiliate_id'],
  Button,
)
const UpdateCellXPertButton = withRulesAccessController(['crm:update'], Button)

export const ListOverview: React.FC<ListOverviewProps> = ({
  userData,
  updateUserData,
  modifyBalance,
  editAffiliate,
  clearAffiliate,
  editRoowardLevel,
  editCxdAffiliate,
  editCxd,
}) => {
  const classes = useListOverviewStyles()
  const confirm = useConfirm()

  const { user, banStatus, settings, roowardsLevels } = userData

  const balances = user.balances

  const AllBalanceList = Object.keys(balances)
    .filter(balanceKey => !!balanceTypeToFullname[balanceKey])
    .map(balanceKey => ({
      label: `${balanceTypeToFullname[balanceKey]} Balance`,
      balanceType: balanceKey,
    }))

  const totalTipped = user.totalTipped || 0
  const totalTipsReceived = user.totalTipsReceived || 0
  const totalRoowardsClaimed = user.roowardsClaimed || 0

  const { data } = useQuery(UserQuery, {
    variables: { userId: user.id },
    onError: error => {
      console.error(error)
    },
  })
  const [creditTicketsMutationFn] = useMutation(CreditRaffleTicketsMutation)

  const creditRaffleTickets = React.useCallback(
    (id, name) => {
      confirm<{ numberOfTickets: string }>({
        title: `Add Raffle Tickets - ${name}`,
        message: 'Choose an amount of tickets',
        inputs: [
          {
            type: 'number',
            key: 'numberOfTickets',
            name: 'Number of Tickets',
          },
        ],
      }).then(({ numberOfTickets }) => {
        creditTicketsMutationFn({
          variables: {
            raffleId: id,
            userId: user.id,
            amount: Number(numberOfTickets),
          },
        })
      })
    },
    [user.id, confirm, creditTicketsMutationFn],
  )

  return (
    <List className={classes.infoWrapper}>
      {!!user.lockedUntil &&
        moment(user.lockedUntil) > moment() &&
        user.lockReason && (
          <ListItem disableGutters dense>
            <Typography
              className={classes.userFieldName}
              color="textSecondary"
              variant="body2"
            >
              Locked Reason
            </Typography>
            <Typography className={classes.userFieldValue} variant="body2">
              {user.lockReason}
              {moment(user.lockedUntil) > moment() &&
                ` - Until ${moment(user.lockedUntil).format('lll')}`}
            </Typography>
          </ListItem>
        )}

      <div className={classes.togglesContainer}>
        <Typography variant="h6" color="textPrimary">
          Toggles
        </Typography>
        <ToggleUserViews userData={userData} updateUserData={updateUserData} />
      </div>

      <Typography variant="h6" color="textPrimary">
        Balances
      </Typography>

      {AllBalanceList.map(balance => (
        <BalanceListItem
          key={balance.label}
          label={balance.label}
          balanceType={balance.balanceType}
          userBalance={balances[balance.balanceType]}
          modifyBalance={modifyBalance}
        />
      ))}
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Withdraw Limit
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {user.dailyWithdrawLimit
            ? numeral(user.dailyWithdrawLimit).format('$0,0.00')
            : 'Default'}
        </Typography>
      </ListItem>

      <Typography variant="h6" color="textPrimary">
        Stats
      </Typography>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Deposited
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalDeposited).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Deposits
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalDeposits).format('0,0')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Withdrawn
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalWithdrawn).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Tipped
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.totalTipped).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Tips Received
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.totalTipsReceived).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Lifetime Value
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(
            user.hiddenTotalDeposited -
              user.hiddenTotalWithdrawn -
              (totalTipped - totalTipsReceived),
          ).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Wagers
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalBets).format('0,0')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Wagered
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalBet).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Won
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalWon).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          GGR
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenTotalBet - user.hiddenTotalWon).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Sports Wagers
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenSportsTotalBets).format('0,0')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Sports Wagered
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenSportsTotalBet).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Sports Won
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(user.hiddenSportsTotalWon).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Sports GGR
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(
            (user.hiddenSportsTotalBet ?? 0) - (user.hiddenSportsTotalWon ?? 0),
          ).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Roowards Claimed:
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(totalRoowardsClaimed).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          LifeTime KOTH Earnings:
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(userData.userKOTHEarnings.lifeTime).format('$0,0.00')}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Latest KOTH Earnings:
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {numeral(userData.userKOTHEarnings.latest).format('$0,0.00')}
        </Typography>
      </ListItem>

      <Typography variant="h6" color="textPrimary">
        Roowards
      </Typography>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Daily
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          Level {roowardsLevels?.d?.level || 0}
        </Typography>
        <div className={classes.listItemButtons}>
          <UpdateRoowardsButton
            className={classes.balanceModifier}
            onClick={() => editRoowardLevel({ rewardType: 'd' })}
          >
            Edit
          </UpdateRoowardsButton>
        </div>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Weekly
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          Level {roowardsLevels?.w?.level || 0}
        </Typography>
        <div className={classes.listItemButtons}>
          <UpdateRoowardsButton
            className={classes.balanceModifier}
            onClick={() => editRoowardLevel({ rewardType: 'w' })}
          >
            Edit
          </UpdateRoowardsButton>
        </div>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Monthly
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          Level {roowardsLevels?.m?.level || 0}
        </Typography>
        <div className={classes.listItemButtons}>
          <UpdateRoowardsButton
            className={classes.balanceModifier}
            onClick={() => editRoowardLevel({ rewardType: 'm' })}
          >
            Edit
          </UpdateRoowardsButton>
        </div>
      </ListItem>

      {data?.user?.raffleEntries?.length > 0 && (
        <>
          <Typography variant="h6" color="textPrimary">
            Raffles
          </Typography>
          {data?.user?.raffleEntries?.map(raffleEntry => (
            <ListItem
              key={raffleEntry.id}
              className={classes.listItemButtonContainer}
              disableGutters
              dense
            >
              <Typography
                className={classes.userFieldName}
                color="textSecondary"
                variant="body2"
              >
                {raffleEntry.name} Tickets
              </Typography>
              <Typography className={classes.userFieldValue} variant="body2">
                {numeral(raffleEntry.tickets || 0).format('0,0')}
              </Typography>
              <div className={classes.listItemButtons}>
                <Button
                  className={classes.balanceModifier}
                  onClick={() =>
                    creditRaffleTickets(raffleEntry.id, raffleEntry.name)
                  }
                >
                  Add
                </Button>
              </div>
            </ListItem>
          ))}
        </>
      )}

      <Typography variant="h6" color="textPrimary">
        Cellxpert
      </Typography>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          CXD
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {userData.affiliate.refCxd ?? 'None'}
        </Typography>
        <div className={classes.listItemButtons}>
          <UpdateCellXPertButton
            className={classes.balanceModifier}
            onClick={() => editCxd()}
          >
            Edit
          </UpdateCellXPertButton>
        </div>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Affiliate ID
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {userData.affiliate.refCxAffId ?? 'None'}
        </Typography>
        <div className={classes.listItemButtons}>
          <UpdateCellXPertButton
            className={classes.balanceModifier}
            onClick={() => editCxdAffiliate()}
          >
            Edit
          </UpdateCellXPertButton>
        </div>
      </ListItem>

      <Typography variant="h6" color="textPrimary">
        Misc.
      </Typography>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Custom Affiliate Cut
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {user.customAffiliateCut ? user.customAffiliateCut : 'No'}
        </Typography>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          2FA Enabled
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {user.twofactorEnabled ? 'Yes' : 'No'}
        </Typography>
      </ListItem>
      {user.twofactorEnabledAt && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            2FA Enabled At
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment(user.twofactorEnabledAt).format('lll Z')}
          </Typography>
        </ListItem>
      )}
      {user.lastDeposit && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Last Deposit
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment(user.lastDeposit).format('lll Z')}
          </Typography>
        </ListItem>
      )}
      {user.lastBet && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Last Bet
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment(user.lastBet).format('lll Z')}
          </Typography>
        </ListItem>
      )}
      {user.lastLogin && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Last Login
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment(user.lastLogin).format('lll Z')}
          </Typography>
        </ListItem>
      )}
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Affiliated By
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {user.affiliateId || 'None'}
        </Typography>
        <div className={classes.listItemButtons}>
          <UpdateAffiliateButton
            className={classes.balanceModifier}
            onClick={editAffiliate}
          >
            Edit
          </UpdateAffiliateButton>
          <UpdateAffiliateButton
            className={classes.balanceModifier}
            onClick={clearAffiliate}
          >
            Clear
          </UpdateAffiliateButton>
        </div>
      </ListItem>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Incognito
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {settings && settings.feed && settings.feed.incognito ? 'Yes' : 'No'}
        </Typography>
      </ListItem>

      <Typography variant="h6" color="textPrimary">
        Chat
      </Typography>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Banned
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {banStatus && banStatus.chatBanned ? 'Yes' : 'No'}
        </Typography>
      </ListItem>
      {banStatus && banStatus.banCount && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Ban Count
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {banStatus.banCount}
          </Typography>
        </ListItem>
      )}
      {banStatus && banStatus.banReason && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Ban Reason
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {banStatus.banReason}
          </Typography>
        </ListItem>
      )}
      {banStatus && banStatus.chatBannedBy && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Banned By
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {banStatus.chatBannedBy}
          </Typography>
        </ListItem>
      )}
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Muted
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {banStatus && moment(banStatus.muteTime) > moment() ? 'Yes' : 'No'}
        </Typography>
      </ListItem>
      {banStatus && banStatus.muteCount && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Mute Count
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {banStatus.muteCount}
          </Typography>
        </ListItem>
      )}
      {banStatus?.mutedAt && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Muted At
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment(banStatus.mutedAt).format('lll Z')}
          </Typography>
        </ListItem>
      )}
      {banStatus?.muteTime && banStatus?.mutedAt && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Mute Length
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment
              .duration(
                moment(banStatus.muteTime).diff(moment(banStatus.mutedAt)),
              )
              .asMinutes()
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
            minutes
          </Typography>
        </ListItem>
      )}
      {banStatus?.muteTime && moment(banStatus.muteTime) > moment() && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Mute Expires In
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {moment
              .duration(moment(banStatus.muteTime).diff(moment()))
              .asMinutes()
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
            minutes
          </Typography>
        </ListItem>
      )}
      {banStatus?.muteReason && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Mute Reason
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {banStatus.muteReason}
          </Typography>
        </ListItem>
      )}
      {banStatus?.chatMutedBy && (
        <ListItem disableGutters dense>
          <Typography
            className={classes.userFieldName}
            color="textSecondary"
            variant="body2"
          >
            Muted By
          </Typography>
          <Typography className={classes.userFieldValue} variant="body2">
            {banStatus.chatMutedBy}
          </Typography>
        </ListItem>
      )}

      <Typography variant="h6" color="textPrimary">
        Howie Deal
      </Typography>
      <ListItem disableGutters dense>
        <Typography
          className={classes.userFieldName}
          color="textSecondary"
          variant="body2"
        >
          Enabled
        </Typography>
        <Typography className={classes.userFieldValue} variant="body2">
          {user.howieDeal ? 'Yes' : 'No'}
        </Typography>
      </ListItem>

      {!!user.howieDeal && (
        <>
          <ListItem disableGutters dense>
            <Typography
              className={classes.userFieldName}
              color="textSecondary"
              variant="body2"
            >
              Percentage
            </Typography>
            <Typography className={classes.userFieldValue} variant="body2">
              {typeof user.howieDeal.percent !== 'number'
                ? 'N/A'
                : user.howieDeal.percent.toFixed(2)}
            </Typography>
          </ListItem>
          <ListItem disableGutters dense>
            <Typography
              className={classes.userFieldName}
              color="textSecondary"
              variant="body2"
            >
              Total
            </Typography>
            <Typography className={classes.userFieldValue} variant="body2">
              {typeof user.howieDeal.remaining !== 'number'
                ? 'N/A'
                : numeral(user.howieDeal.remaining).format('$0,0.00[00]')}
            </Typography>
          </ListItem>
          <ListItem disableGutters dense>
            <Typography
              className={classes.userFieldName}
              color="textSecondary"
              variant="body2"
            >
              Remaining
            </Typography>
            <Typography className={classes.userFieldValue} variant="body2">
              {typeof user.howieDeal.total !== 'number'
                ? 'N/A'
                : numeral(user.howieDeal.total).format('$0,0.00[00]')}
            </Typography>
          </ListItem>
        </>
      )}
    </List>
  )
}
