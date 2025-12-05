import { InputField, theme as uiTheme } from '@project-atl/ui'
import React from 'react'

import { useCurrencyFormatter, useTranslate } from 'app/hooks'

import { useCommonDialogStyles } from '../../../Dialog.styles'
import { useVerifyStyles } from '../Verify.styles'

// t('blackjack.verifyPlayerSideWagerType_twenty-one-plus-three')
// t('blackjack.verifyPlayerSideWagerType_perfect-pair')
// t('blackjack.verifyPlayerSideWagerType_insurance')
const getTypeLabel = (type: string) => {
  return `blackjack.verifyPlayerSideWagerType_${type}`
}

// t('blackjack.verifyPlayerOutcome_win')
// t('blackjack.verifyPlayerOutcome_loss')
// t('blackjack.verifyPlayerOutcome_push')
// t('blackjack.verifyPlayerOutcome_draw')
// t('blackjack.verifyPlayerOutcome_unknown')
const getOutcomeLabel = (outcome: string) => {
  return `blackjack.verifyPlayerOutcome_${outcome}`
}

const VerifyBlackjackResults: React.FC<VerifyBlackjackResultsProps> = ({
  results,
}) => {
  const classes = useVerifyStyles()
  const formatCurrency = useCurrencyFormatter()
  const commonDialogClasses = useCommonDialogStyles({
    color: uiTheme.palette.common.white,
  })
  const translate = useTranslate()
  const cardSeparator = ' - '
  const { result } = results
  return (
    <div className={classes.Verify}>
      <span className={commonDialogClasses.formLabel}>
        {translate('blackjack.verifyActionsHash')}
      </span>
      <InputField
        type="text"
        value={result.actionsHash}
        placeholder={translate('blackjack.verifyActionsHash')}
        className={classes.Verify__formInput}
        disabled
      />
      <span className={commonDialogClasses.formLabel}>
        {translate('blackjack.verifyShoeUsed')}
      </span>
      <InputField
        type="text"
        value={result.shoeUsed.join(cardSeparator)}
        placeholder={translate('blackjack.verifyShoeUsed')}
        className={classes.Verify__formInput}
        disabled
      />
      <span className={commonDialogClasses.formLabel}>
        {translate('blackjack.verifyDealerCards')}
      </span>
      <InputField
        type="text"
        value={result.dealerCards.join(cardSeparator)}
        placeholder={translate('blackjack.verifyDealerCards')}
        className={classes.Verify__formInput}
        disabled
      />
      <div>
        <span className={commonDialogClasses.formLabel}>
          {translate('blackjack.verifyPlayerHands')}
        </span>
        {Object.keys(result.handResults).map(key => {
          const handResult = result.handResults[key]

          const outcomeKey = getOutcomeLabel(handResult.outcome)
          const outcome = translate(outcomeKey)

          // t('blackjack.verifyPlayerHandDesc')
          const handDescription = translate('blackjack.verifyPlayerHandDesc', {
            key: key + 1,
          })

          // t('blackjack.verifyPlayerCardsDesc')
          const cardDescription = translate('blackjack.verifyPlayerCardsDesc', {
            key: key + 1,
          })

          const cards = handResult.cards.join(cardSeparator)
          const amount = formatCurrency(handResult.wager.amount)
          const hasSideWagers = handResult.wager.sides.length > 0
          return (
            <div key={key}>
              <span className={commonDialogClasses.formLabel}>
                {handDescription}
              </span>
              <InputField
                type="text"
                value={`${amount} / ${outcome}`}
                placeholder={handDescription}
                className={classes.Verify__formInput}
                disabled
              />
              <span className={commonDialogClasses.formLabel}>
                {cardDescription}
              </span>
              <InputField
                type="text"
                value={cards}
                placeholder={cardDescription}
                className={classes.Verify__formInput}
                disabled
              />
              {hasSideWagers && (
                <div>
                  <span className={commonDialogClasses.formLabel}>
                    {translate('blackjack.verifyPlayerSideWagerTitle')}
                  </span>
                  {handResult.wager.sides.map((sideWager, index) => {
                    const amount = formatCurrency(sideWager.amount)

                    const typeKey = getTypeLabel(sideWager.type)
                    const type = translate(typeKey)

                    const outcomeKey = getOutcomeLabel(sideWager.outcome)
                    const outcome = translate(outcomeKey)

                    return (
                      <div key={index}>
                        <span className={commonDialogClasses.formLabel}>
                          {type}{' '}
                        </span>
                        <InputField
                          type="text"
                          value={`${amount} / ${outcome}`}
                          className={classes.Verify__formInput}
                          disabled
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(VerifyBlackjackResults)

/**
 * The Blackjack Verification Results Props.
 *
 * This syncs with types from `backend/src/modules/blackjack/lib/verify.ts`.
 */
interface VerifyBlackjackResultsProps {
  results: {
    serverSeed: string
    hashedServerSeed: string | null
    nonce?: number | null
    clientSeed: string | undefined
    gameHash?: string
    outcome?: 'heads' | 'tails'
    blockHeight?: number
    hashForOtherPlayer?: { gameFinalHash?: string | null } | null
    result: {
      shoeUsed: string[]
      shoeLeft: string[]
      dealerCards: string[]
      actionsHash: string
      handResults: Record<string, VerificationHand>
    }
  }
}

/**
 * The shape of hand details for a {@link VerificationResults} instance.
 */
interface VerificationHand {
  outcome: string
  cards: string[]
  value: number
  wager: {
    amount: number
    sides: Array<{
      type: string
      amount: number
      outcome: string
    }>
  }
}
