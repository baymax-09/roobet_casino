import React from 'react'

import { api } from 'common/util'
import { useAxiosGet, useToasts } from 'common/hooks'

interface CMSContent {
  title: string
  content: string
  format: 'text' | 'markdown'
}

export function useCmsContent(name, lang) {
  const { toast } = useToasts()

  const [doc, setDoc] = React.useState<Partial<CMSContent>>({})

  useAxiosGet<CMSContent>(`admin/cms/${name}/${lang}`, {
    onCompleted: doc => {
      const { title, content, format } = doc
      setDoc({ title, content, format })
    },
    onError: () => {
      setDoc({})
    },
  })

  const updateDoc = async updatedDoc => {
    const method = doc.content ? 'patch' : 'post'
    const endpoint = `admin/cms/${name}/${lang}`
    try {
      const updated = await api[method](endpoint, updatedDoc)
      // @ts-expect-error This is incorrect due to our interceptor
      setDoc(updated)

      toast.info('The copy has been saved.')
    } catch (error) {
      toast.error(`Failed to update ${name} content.`)
    }
  }

  return [doc, updateDoc] as const
}
