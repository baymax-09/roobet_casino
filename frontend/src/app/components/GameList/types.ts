export interface GameProvider {
  name: string
  disabled: boolean
  count?: number
}

export interface GameListPageProps {
  list: {
    title?: string
    showImFeelingLucky?: boolean
    path: string
    pageSize?: number
    logo?: string
    options: {
      group?: string
      includeRecommendedSort?: boolean
      kothPage?: string
      tagSlug?: string
    }
  }
}
