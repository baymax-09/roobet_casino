import React from 'react'
import { Helmet } from 'react-helmet'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { Loading, Container } from 'mrooi'
import { useLazyRoute } from 'app/hooks'

import { useBasicPageStyles } from './BasicPage.styles'

type BasicPageContainerProps = React.PropsWithChildren<{
  title?: string | React.ReactNode
  helmetTitle?: string
  titleChildren?: React.ReactNode
  loading?: boolean
  showTitle?: boolean
}>

export const BasicPageContainer: React.FC<BasicPageContainerProps> = ({
  title,
  helmetTitle,
  titleChildren,
  loading = false,
  children,
  showTitle = true,
}) => {
  const classes = useBasicPageStyles()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  // Finish page transition when loading is finished.
  useLazyRoute(!loading)

  return (
    <div className={classes.BasicPage}>
      <Container className={classes.BasicPage__container}>
        {loading ? (
          <Loading />
        ) : (
          <>
            <Helmet title={helmetTitle ?? title} />
            {showTitle && (
              <div className={classes.BasicPage__titleContainer}>
                <Typography
                  component="span"
                  variant="h5"
                  color={uiTheme.palette.common.white}
                  fontWeight={uiTheme.typography.fontWeightBold}
                  marginRight="auto"
                  {...(!isTabletOrDesktop && {
                    fontSize: '1.5rem',
                    lineHeight: '2rem',
                  })}
                >
                  {title}
                </Typography>
                {titleChildren}
              </div>
            )}
            <div className={classes.BasicPage__mainContentContainer}>
              {children}
            </div>
          </>
        )}
      </Container>
    </div>
  )
}
