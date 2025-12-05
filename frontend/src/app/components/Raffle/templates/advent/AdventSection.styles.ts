import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type CSSProperties } from 'react'

interface AdventSectionParams {
  gridArea: CSSProperties['gridArea']
}

export const useAdventSectionStyles = makeStyles(() =>
  createStyles({
    AdventSection: ({ gridArea }: AdventSectionParams) => ({
      gridArea,
      position: 'relative',
    }),

    AdventSection__imageContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
    },

    ImageContainer__image: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,

      backgroundPosition: 'center',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
    },
  }),
)
