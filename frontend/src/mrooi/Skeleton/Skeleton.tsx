import { motion } from 'framer-motion'
import withStyles from '@mui/styles/withStyles'
import createStyles from '@mui/styles/createStyles'
import { Skeleton as MuiSkeleton } from '@mui/material'

export const Skeleton = withStyles(() =>
  createStyles({
    root: {
      borderRadius: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
  }),
)(motion(MuiSkeleton))
