import React from 'react'
import { Skeleton } from '@mui/material'

export type PreloadSkeletonProps = Partial<
  React.PropsWithChildren<{
    component: React.ReactNode
    options: {
      style?: any
      width?: any
      height?: any
    }
    loading: boolean
  }>
>

// invert loading to test locally
const PreloadSkeleton: React.FC<PreloadSkeletonProps> = ({
  component,
  options,
  loading,
  children,
}) => (
  <>
    {loading ? (
      <Skeleton
        variant="rectangular"
        width={options?.width || '100%'}
        height={options?.height || 45}
        style={options?.style || {}}
      />
    ) : (
      component || children
    )}
  </>
)

export default React.memo(PreloadSkeleton)
