import React from 'react'
import { Box } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { LINK_CATEGORIES, SOCIAL_LINK_CATEGORIES } from 'app/constants/footer'
import XTwitterIcon from 'assets/icons/newDesignIcons/XTwitter.svg'

import { FooterCategoryColumn } from './FooterCategoryColumn'

import { useFooterStyles } from './Footer.styles'
import { useFooterLinkCategoriesStyles } from './FooterLinkCategories.styles'

export const FooterLinkCategories = () => {
  const classes = useFooterLinkCategoriesStyles()
  const baseClasses = useFooterStyles()
  const { t: translate } = useTranslation()

  const [open, setOpen] = React.useState<string | null>(null)

  return (
    <div className={classes.FooterLinkCategories}>
      {LINK_CATEGORIES.map(linkCategory => {
        const { title, items } = linkCategory
        return (
          <div key={title} className={baseClasses.LinkContainer__linkList}>
            <FooterCategoryColumn
              title={title}
              items={items}
              open={open}
              setOpen={setOpen}
            />
          </div>
        )
      })}
      <div className={classes.SocialLinkContainer}>
        <div className={classes.SocialLinkContainerButtonContainer__title}>
          <Typography
            variant="body2"
            color="white"
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {translate('footer.community')}
          </Typography>
        </div>
        <div className={classes.SocialLinkContainerButtonContainer}>
          <Box
            key="x-twitter"
            target="_blank"
            rel="noopener noreferrer"
            href="https://twitter.com/roobet"
            component="a"
            className={classes.SocialLinkContainerButtonContainer__item}
          >
            <XTwitterIcon
              className={clsx(
                classes.SocialLinkContainerButtonContainer__icon,
                classes.SocialLinkContainerButtonContainer__xTwitterIcon,
              )}
            />
          </Box>
          {SOCIAL_LINK_CATEGORIES.map(({ to, icon }, index) => {
            return (
              <Box
                component="a"
                key={index}
                target="_blank"
                rel="noopener noreferrer"
                href={to}
                className={classes.SocialLinkContainerButtonContainer__item}
              >
                <FontAwesomeIcon
                  className={classes.SocialLinkContainerButtonContainer__icon}
                  icon={[icon[0], icon[1]]}
                />
              </Box>
            )
          })}
        </div>
      </div>
    </div>
  )
}
