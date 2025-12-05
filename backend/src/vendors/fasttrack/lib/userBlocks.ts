export interface UserBlocks {
  blocks: [
    {
      active: boolean
      type: 'Excluded'
      note: string
    },
    {
      active: boolean
      type: 'Blocked'
      note: string
    },
  ]
}
