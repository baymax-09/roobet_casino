import React from 'react'
import JSZip from 'jszip'

import { BulkActions, downloadPath } from 'admin/components/BulkActions'
import { calculateImageDimensions, prettyPrintSize } from 'common/util'
import { TP_GAMES_SQUARE_IMAGE } from 'admin/constants'
import { withRulesAccessController } from 'admin/components'

const { maxSize, width, height } = TP_GAMES_SQUARE_IMAGE

const columns = [
  {
    name: 'id',
    label: 'Game Identifier',
    type: 'string',
  },
  {
    name: 'squareImage',
    label: `Square Image (${width}x${height}px; ≤ ${prettyPrintSize(maxSize)})`,
    type: 'image',
    options: {
      customBodyRender: cell => {
        if (cell?.error) {
          return `Error: ${cell.error}`
        }

        return cell?.filename ?? ''
      },
    },
  },
]

// This example archive must be updated if the form changes.
const downloadExample = () => {
  downloadPath('assets/bulk/game-updates-sample.zip')
}

const parseInputFile = async file => {
  const jszip = new JSZip()

  const bin = await jszip.loadAsync(file)

  const csvData = Object.keys(bin.files).reduce((rows, filename) => {
    // Matches {provider}_{gameName}.{ext} in the root directory.
    const matches = filename.match(/^([a-z0-9]+)[_]([A-z0-9]+)\.([a-z]+)$/i)

    if (!matches) {
      return rows
    }

    return [
      ...rows,
      {
        id: `${matches[1]}:${matches[2]}`,
        squareImage: filename,
      },
    ]
  }, [])

  return Promise.all(
    csvData.map(async row => {
      const squareImage = await (async () => {
        if (!row.squareImage || !bin.files[row.squareImage]) {
          return undefined
        }

        const file = bin.files[row.squareImage]
        const blob = await file.async('blob')

        // First, ensure image matches required dimensions.
        if (blob.size > maxSize) {
          return {
            error: `The image must be less than or equal to ${prettyPrintSize(
              TP_GAMES_SQUARE_IMAGE.maxSize,
            )}.`,
          }
        }

        const dimensions = await calculateImageDimensions(blob)

        if (width !== dimensions.width) {
          return {
            error: `The image must be exactly ${width}px in width.`,
          }
        }

        if (height !== dimensions.height) {
          return {
            error: `The image must be exactly ${width}px in height.`,
          }
        }

        const imageData = await file.async('base64')

        return {
          filename: row.squareImage,
          data: imageData,
        }
      })()

      return {
        ...row,
        squareImage,
      }
    }),
  )
}

const options = {
  id: 'game-images',
  title: 'Game Images',
  endpoint: '/admin/tp-games/bulkUpdate',
  copy: {
    upload: () => 'Upload Zip',
    example: () => 'Example Zip',
  },
  columns,
  downloadExample,
  parseInputFile,
}

const AccessBulkActions = withRulesAccessController(
  ['tpgames:update_bulk'],
  BulkActions,
)

export const BulkGameImages: React.FC = () => {
  return <AccessBulkActions {...options} />
}
