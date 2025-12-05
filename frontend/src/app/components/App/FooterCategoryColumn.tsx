import React, { type PropsWithChildren } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Link, Collapse, List, ListItem, useMediaQuery } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ListItemText, Typography, theme as uiTheme } from '@project-atl/ui'
import { ChevronDown } from '@project-atl/ui/assets'
import clsx from 'clsx'

import { type FooterLink } from 'app/constants/footer'

import { useFooterCategoryColumnStyles } from './FooterCategoryColumn.styles'

interface FooterCategoryColumnProps {
  title: string
  items: FooterLink[]
  open: string | null
  setOpen: React.Dispatch<React.SetStateAction<string | null>>
}

export const FooterCategoryColumn: React.FC<
  PropsWithChildren<FooterCategoryColumnProps>
> = ({ title, items, open, setOpen }) => {
  const classes = useFooterCategoryColumnStyles()
  const { t: translate } = useTranslation()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const handleClick = React.useCallback(() => {
    const value = open === title ? null : title
    setOpen(value)
  }, [open, title, setOpen])

  const renderList = React.useCallback(
    (node: React.ReactNode) => {
      if (isTabletOrDesktop) {
        return node
      }

      return (
        <Collapse in={open === title} timeout="auto" unmountOnExit>
          {node}
        </Collapse>
      )
    },
    [isTabletOrDesktop, open, title],
  )

  const getListItemProps = React.useCallback((item: FooterLink) => {
    const { to, externalLink, onClick } = item
    if (onClick) {
      return { component: 'span', onClick }
    }
    if (externalLink) {
      return {
        component: Link,
        href: to,
        underline: 'hover',
        rel: 'noreferrer',
        target: '_blank',
        sx: {
          color: 'neutral.400',
        },
      }
    }
    return { component: RouterLink, to }
  }, [])

  return (
    <>
      <div
        className={classes.FooterCategoryColumnTitleContainer}
        {...(!isTabletOrDesktop && { onClick: handleClick })}
      >
        <Typography
          variant="body2"
          color="white"
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {translate(title)}
        </Typography>
        {!isTabletOrDesktop && (
          <ChevronDown
            className={classes.FooterCategoryColumnTitleContainer__icon}
          />
        )}
      </div>
      {renderList(
        <List
          className={clsx(classes.FooterCategoryColumnList, {
            [classes.FooterCategoryColumnList_mobile]: !isTabletOrDesktop,
          })}
          component="div"
          disablePadding
        >
          {items.map(item => {
            const { to, label } = item
            const listItemProps = getListItemProps(item)
            return (
              <ListItem
                key={to}
                disableRipple
                className={classes.FooterCategoryColumnListItem}
                {...listItemProps}
              >
                <ListItemText
                  primaryTypographyProps={{ variant: 'body2' }}
                  className={classes.FooterCategoryColumnListItem__text}
                >
                  {translate(label)}
                </ListItemText>
              </ListItem>
            )
          })}
        </List>,
      )}
    </>
  )
}
