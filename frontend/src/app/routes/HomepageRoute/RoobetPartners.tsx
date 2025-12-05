import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { useTranslate } from 'app/hooks'
import snoopDogg from 'assets/images/roobetPartners/snoopDogg.png'
import charlesOliveira from 'assets/images/roobetPartners/charlesOliveira.png'
import { getCachedSrc } from 'common/util'
import { Slider } from 'mrooi'

const ROOBET_PARTNERS = [
  {
    key: 'snoopDogg',
    logo: snoopDogg,
    title: 'Snoop Dogg',
  },
  {
    key: 'charlesOliveira',
    logo: charlesOliveira,
    title: 'Charles Oliveira',
  },
] as const

export const useRoobetPartnersStyles = makeStyles(() =>
  createStyles({
    RoobetPartner__logo: {
      position: 'absolute',
      right: 0,
      top: '-10px',
      bottom: 0,
      width: '95px',
      height: '95px',

      [uiTheme.breakpoints.up('md')]: {
        width: '130px',
        height: '130px',
        top: '-13px',
      },
    },

    RoobetPartnerSliderContainer: {
      // Kind of hacky, but will assure the images aren't being cutoff by Slider component.
      paddingTop: uiTheme.spacing(1.5),
      marginTop: `-${uiTheme.spacing(1.5)}`,

      [uiTheme.breakpoints.up('md')]: {
        // Kind of hacky, but will assure the images aren't being cutoff by Slider component.
        paddingTop: uiTheme.spacing(2),
        marginTop: `-${uiTheme.spacing(2)}`,
      },
    },

    RoobetPartnerSlides: {
      // Kind of hacky, but will assure the images aren't being cutoff by Slider component.
      paddingTop: uiTheme.spacing(3),
      marginTop: `-${uiTheme.spacing(3)}`,
    },

    RoobetPartnerSlide: {
      padding: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
      position: 'relative',
      borderRadius: '12px',
      width: `max(268px, calc(50% - ${uiTheme.spacing(0.5)}))`,

      // Need to overwrite default marginRight for custom spacing in between slides
      '&:not(:last-of-type)': {
        marginRight: `${uiTheme.spacing(1)} !important`,
      },

      [uiTheme.breakpoints.up('md')]: {
        width: `calc(50% - ${uiTheme.spacing(1)})`,
        padding: uiTheme.spacing(3.5),

        '&:not(:last-of-type)': {
          marginRight: `${uiTheme.spacing(2)} !important`,
        },
      },
    },
  }),
)

export const RoobetPartners: React.FC = () => {
  const classes = useRoobetPartnersStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const slides = React.useMemo(
    () =>
      ROOBET_PARTNERS.map(({ key, logo, title }) => (
        <div key={key}>
          <Typography
            component="p"
            variant="body4"
            fontWeight={uiTheme.typography.fontWeightMedium}
            color={uiTheme.palette.neutral[400]}
          >
            {translate('homepage.officialPartnerOf')}
          </Typography>
          <Typography
            component="p"
            fontWeight={uiTheme.typography.fontWeightMedium}
            color={uiTheme.palette.common.white}
            {...(isTabletOrDesktop
              ? {
                  fontSize: '1.5rem',
                  lineHeight: '2rem',
                }
              : {
                  fontSize: '1.375rem',
                  lineHeight: '1.75rem',
                })}
          >
            {title}
          </Typography>
          <img
            className={classes.RoobetPartner__logo}
            alt={title}
            src={getCachedSrc({ src: logo })}
          />
        </div>
      )),
    [isTabletOrDesktop],
  )

  return (
    <Slider
      sliderContainerClassName={classes.RoobetPartnerSliderContainer}
      slidesClassName={classes.RoobetPartnerSlides}
      slideClassName={classes.RoobetPartnerSlide}
      title={translate('homepage.roobetPartners')}
      slides={slides}
      fullPageSlide
    />
  )
}
