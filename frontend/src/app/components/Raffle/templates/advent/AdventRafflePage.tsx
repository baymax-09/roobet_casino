import { Trans } from 'react-i18next'
import React, { type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useSelector } from 'react-redux'
import numeral from 'numeral'
import moment from 'moment'
import { Typography } from '@mui/material'

import hero1 from 'assets/images/raffle/advent/2023-12-frosty/hero1.png'
import hero2 from 'assets/images/raffle/advent/2023-12-frosty/hero2.png'
import hero3 from 'assets/images/raffle/advent/2023-12-frosty/hero3.png'
import { createMoment, getCachedSrc } from 'common/util'
import { useIsLoggedIn, useDialogsOpener } from 'app/hooks'

import AdventPrize from './AdventPrize'
import AdventSection from './AdventSection'
import AdventBanner from './AdventBanner'
import AdventPrizeDialog from './AdventPrizeDialog'
import { AdventWinnersTableModal } from './AdventWinnersTableModal'
import { useSharedRaffleStyles } from '../shared'
import { type RaffleComponentProps } from '../../types'

import { useAdventRafflePageStyles } from './AdventRafflePage.styles'

export interface AdventSectionImageConfig {
  key: string
  src: RoobetAssetPath<any>
  styles: CSSProperties
}

const _Section2Images: AdventSectionImageConfig[] = [
  {
    key: 'hero',
    src: hero1,
    styles: {
      filter: 'drop-shadow(-7px 7px 3px rgba(0, 0, 0, 0.6))',
    },
  },
]

const _Section3Images: AdventSectionImageConfig[] = [
  {
    key: 'hero',
    src: hero2,
    styles: {
      filter: 'drop-shadow(-7px 7px 3px rgba(0, 0, 0, 0.6))',
    },
  },
]

const _Section4Images: AdventSectionImageConfig[] = [
  {
    key: 'hero',
    src: hero3,
    styles: {
      filter: 'drop-shadow(-7px 7px 3px rgba(0, 0, 0, 0.6))',
    },
  },
]

export const AdventRafflePage: React.FC<RaffleComponentProps> = ({
  raffle,
  reload,
}) => {
  const classes = {
    ...useSharedRaffleStyles({}),
    ...useAdventRafflePageStyles(),
  }
  // const translate = useTranslate()
  const location = useLocation()
  const isLoggedIn = useIsLoggedIn()
  const openDialog = useDialogsOpener()
  const [claimed, setClaimed] = React.useState(false)
  const [tickets, setTickets] = React.useState(0)
  const [selectedPrize, setSelectedPrize] = React.useState<
    (typeof adventPrizes)[number] | null
  >(null)
  const [openWinnersModal, setOpenWinnersModal] = React.useState(false)
  const serverTime = useSelector(({ settings }) => settings.serverTime)

  const { winners = [], winnersRevealed } = raffle

  const raffleDays = React.useMemo(() => {
    // Include last day.
    const length = Math.ceil(
      moment(raffle.end).diff(raffle.start, 'days', true),
    )

    return Array.from({ length }, (_, i) => {
      return moment(raffle.start).add(i, 'days').format('MM/DD')
    })
  }, [raffle.start, raffle.end])

  const firstDay = new Date(raffle.start).getDate()

  const adventPrizes = React.useMemo(() => {
    return Array.from({ length: raffleDays.length }, (_, i) => ({
      index: i + 1,
      day: i + firstDay,
      area: `p${i + 1}`,
    }))
  }, [raffleDays, firstDay])

  const day = React.useMemo(() => {
    const now = createMoment(serverTime).format('MM/DD')
    const idx = raffleDays.indexOf(now)

    if (idx < 0) {
      return 0
    }

    return idx + firstDay
  }, [serverTime, raffleDays, firstDay])

  React.useEffect(() => {
    if (location.search.includes('open=1')) {
      const current = createMoment(serverTime).date()
      setSelectedPrize(adventPrizes[current - 1])
    }

    if (raffle.tickets) {
      setTickets(raffle.tickets.tickets)
    }

    setClaimed(!!raffle.hasClaimedRakeback)
  }, [
    adventPrizes,
    location.search,
    raffle.hasClaimedRakeback,
    raffle.tickets,
    serverTime,
  ])

  // These are interpolated with our translation library
  const formattedPrize = numeral(raffle.amount).format('$0,0.00')
  const formattedDate = moment(raffle.end).format('MMM Do')

  const showWinners = winners.length > 0 && winnersRevealed

  return (
    <>
      <Helmet title={raffle.name} />
      <div className={classes.AdventRafflePage}>
        <div className={classes.AdventRafflePage__gridLayout}>
          <AdventSection
            gridArea="info"
            className={classes.GridLayout__headerSection}
          >
            <>
              <div className={classes.HeaderSection__adventBannerContainer}>
                <AdventBanner
                  tickets={tickets}
                  // show countdown or the view winners button
                  showCountdown={!showWinners}
                  viewWinnersOnClick={() => setOpenWinnersModal(true)}
                  serverTime={serverTime}
                  endDate={raffle.end}
                  featureImageSrc={getCachedSrc({ src: raffle.featureImage })}
                  renderButton
                />
              </div>

              <Typography
                variant="body2"
                color="textSecondary"
                classes={{ body2: classes.HeaderSection__details }}
              >
                <Trans
                  i18nKey="holidayRafflePage.holidayRaffleText"
                  values={{
                    date: formattedDate,
                    amount: formattedPrize,
                    winnerCount: raffle.winnerCount,
                  }}
                >
                  <a
                    href="https://opensea.io/Roobetcom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.Details__moreInfoLink}
                  />
                </Trans>
              </Typography>
            </>
          </AdventSection>

          {adventPrizes.map(prize => {
            return (
              <AdventPrize
                key={prize.day}
                prize={prize}
                opened={day > prize.day || (claimed && day === prize.day)}
                focused={!claimed && day === prize.day}
                disabled={day !== prize.day || (claimed && day === prize.day)}
                onClick={() => {
                  if (!isLoggedIn) {
                    openDialog('auth')
                    return
                  }

                  setSelectedPrize(prize)
                }}
              />
            )
          })}

          <AdventSection
            className={classes.GridLayout__imageSection}
            gridArea="s2"
            images={_Section2Images}
          />
          <AdventSection
            className={classes.GridLayout__imageSection}
            gridArea="s3"
            images={_Section3Images}
          />
          <AdventSection
            className={classes.GridLayout__imageSection}
            gridArea="s4"
            images={_Section4Images}
          />
        </div>
      </div>

      {!!selectedPrize && (
        <AdventPrizeDialog
          raffle={raffle}
          prize={selectedPrize}
          wasClaimed={claimed}
          onSuccess={() => {
            setClaimed(true)
            setSelectedPrize(null)
            void reload()
          }}
          onClose={() => setSelectedPrize(null)}
        />
      )}

      <AdventWinnersTableModal
        open={openWinnersModal}
        setOpen={setOpenWinnersModal}
        raffle={raffle}
      />
    </>
  )
}
