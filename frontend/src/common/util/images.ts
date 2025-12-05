import { env } from 'common/constants'
import { api } from 'common/util'

// @see https://developers.cloudflare.com/images/faq/#which-file-formats-does-cloudflare-images-support
const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp'] as const
type AllowedExtension = (typeof ALLOWED_EXTS)[number]
const isAllowedExtension = (value: string): value is AllowedExtension =>
  ALLOWED_EXTS.includes(value.toLowerCase() as AllowedExtension)

const isSupported = src => {
  if (typeof src !== 'string') {
    return false
  }

  if (process.env.NODE_ENV === 'development') {
    return false
  }

  const extension = src.split('?')[0].split('.').pop()
  return !!extension && isAllowedExtension(extension)
}

export type CacheSrcAssetPath = RoobetAssetPath<AllowedExtension>
interface CachedSrc {
  src: RoobetAssetPath<AssetType>
  width?: 'auto' | number
  height?: 'auto' | number
  quality?: number
  blur?: number
}

export const getCachedSrc = ({
  src,
  width = 'auto',
  height = 'auto',
  quality = 85,
  blur = 0,
}: CachedSrc) => {
  if (!isSupported(src)) {
    return src
  }

  let dpr = 1
  if (window.devicePixelRatio) {
    dpr = window.devicePixelRatio
  }

  // If the image is already cached, don't re-cache it.
  const existingCacheRegex = /^https:\/\/roobet\.com\/cdn-cgi\/image\/.*auto\//
  if (existingCacheRegex.test(src)) {
    return src
  }
  return `${env.BASE_URL}cdn-cgi/image/dpr=${dpr},width=${width},height=${height},quality=${quality},blur=${blur},metadata=none,format=auto/${src}`
}

export const calculateImageDimensions = async (
  file: File,
): Promise<{ width: number; height: number }> => {
  return await new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      resolve({ width: image.width, height: image.height })
    }

    image.src = url
  })
}

interface MediaResponse {
  success: boolean
  publicUrl: string
}

export const uploadImage = async (identifier: string, file: File) => {
  const formData = new FormData()

  // Build form data.
  formData.set('filename', identifier)
  formData.append('file', file)

  const result: MediaResponse = await api.post('admin/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return result.publicUrl
}
