import React from 'react'
import { Button, Download, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { ManagedLegalContent, env } from 'common/constants'
import { BasicPageContainer } from 'app/components/BasicPage/BasicPage'
import { useTranslate } from 'app/hooks'

import { useLegalContent } from '../api'

export const SiteTermsRoute: React.FC = () => {
  const [document, loading] = useLegalContent(
    ManagedLegalContent.TERMS_OF_SERVICE.name,
  )
  const translate = useTranslate()

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const handleClick = () => {
    window.location.href = `${env.API_URL}/cms/download/${ManagedLegalContent.TERMS_OF_SERVICE.name}/${document.lang}`
  }

  return (
    <BasicPageContainer
      title={document.title}
      loading={loading}
      titleChildren={
        <Button
          variant="contained"
          color="tertiary"
          size={isTabletOrDesktop ? 'large' : 'extraSmall'}
          onClick={handleClick}
          label={translate('legal.downloadPDF')}
          startIcon={
            <Download
              iconFill={uiTheme.palette.common.white}
              height={16}
              width={16}
            />
          }
          // Said to be a unique padding case per the Figma design? Idk but keep this here for now.
          sx={{
            paddingLeft: '12px !important',
            paddingRight: '16px !important',
          }}
        />
      }
    >
      <span
        dangerouslySetInnerHTML={{
          __html: document.content_html || document.content,
        }}
      />
    </BasicPageContainer>
  )
}
