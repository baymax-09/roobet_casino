import { queryField, stringArg, nonNull } from 'nexus'
import { GraphQLError } from 'graphql'

import { getGeneralBlockchainInfo } from 'src/modules/crypto/lib/blockexplorer'
import { isBlockioCryptoProperName } from 'src/modules/crypto/types'

import { BlockioCurrentBlockType } from '../types/blockioCurrentBlock'

export const BlockioCurrentBlockQueryField = queryField('blockioCurrentBlock', {
  type: BlockioCurrentBlockType,
  auth: {
    authenticated: true,
  },
  args: { crypto: nonNull(stringArg()) },
  resolve: async (_, args) => {
    try {
      const { crypto } = args

      if (!crypto || !isBlockioCryptoProperName(crypto)) {
        throw new GraphQLError('Invalid crypto type for blockio')
      }

      const block = await getGeneralBlockchainInfo(crypto)

      if (!block) {
        throw new GraphQLError('Unable to get current blockio dogecoin block')
      }
      return {
        height: block.height,
      }
    } catch (error) {
      throw new GraphQLError('Unable to get current blockio dogecoin block')
    }
  },
})
