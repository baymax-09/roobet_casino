import React from 'react'
import {
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  theme as uiTheme,
} from '@project-atl/ui'
import { ChevronDown } from '@project-atl/ui/assets'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

import { useVIPFAQsStyles } from './FAQs.styles'

export const FAQs: React.FC = () => {
  const classes = useVIPFAQsStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const [expanded, setExpanded] = React.useState<boolean>(false)

  const onExpandIconClick = () => {
    setExpanded(prev => !prev)
  }

  const faqs = React.useMemo(
    () => [
      {
        question: translate('vip.faqHowToJoin'),
        answer: [translate('vip.faqHowToJoinAnswer')],
      },
      {
        question: translate('vip.faqWhatDoINeedToPlay'),
        answer: [translate('vip.faqWhatDoINeedToPlayAnswer')],
      },
      {
        question: translate('vip.faqWhatAdditionalInforationIsNeeded'),
        answer: [translate('vip.faqWhatAdditionalInforationIsNeededAnswer')],
      },
      {
        question: translate('vip.faqWhyIsRoobetVipTheBest'),
        answer: [
          translate('vip.faqWhyIsRoobetVipTheBestAnswer1'),
          translate('vip.faqWhyIsRoobetVipTheBestAnswer2'),
          translate('vip.faqWhyIsRoobetVipTheBestAnswer3'),
        ],
      },
    ],
    [],
  )

  return (
    <div className={classes.FAQ}>
      <Typography
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.common.white}
        textAlign="start"
        {...(isTabletOrDesktop
          ? { variant: 'h5' }
          : { fontSize: '1.5rem', lineHeight: '2rem' })}
      >
        {translate('vip.faqHeader')}
      </Typography>
      <div className={classes.FAQAccordions}>
        {faqs.map(({ question, answer }, i) => (
          <Accordion key={i} title={question}>
            <AccordionSummary
              expanded={expanded}
              onClick={onExpandIconClick}
              expandIcon={<ChevronDown />}
            >
              {question}
            </AccordionSummary>
            <AccordionDetails>
              <div className={classes.FAQAccordionsDetails}>
                {answer.map((__html, j) => (
                  <Typography
                    variant="body4"
                    key={j}
                    dangerouslySetInnerHTML={{ __html }}
                  />
                ))}
              </div>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </div>
  )
}

export default React.memo(FAQs)
