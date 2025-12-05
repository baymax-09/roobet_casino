import { useAxiosGet } from 'common/hooks'
import { useLocale } from 'app/hooks'

interface CMSDocument {
  title: string
  content_html?: string
  content: string
  lang: string
}

export const useLegalContent = contentName => {
  const userLocale = useLocale()
  const [{ data, loading }] = useAxiosGet<CMSDocument>(
    `cms/${contentName}/${userLocale}`,
  )
  const document = data || {
    title: '',
    content: '',
    content_html: '',
    lang: 'en',
  }

  return [document, loading] as const
}
