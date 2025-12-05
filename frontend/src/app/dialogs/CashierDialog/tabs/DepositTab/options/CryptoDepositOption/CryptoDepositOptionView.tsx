import React from 'react'

import { type CryptoOption } from 'app/constants'

import PreloadSkeleton, {
  type PreloadSkeletonProps,
} from '../../../../PreloadSkeleton'
import { useDepositTabStyles } from '../../DepositTab.styles'

interface CryptoDepositOptionViewProps {
  cashierOption: CryptoOption
  loading: boolean
  qr: React.ReactNode
  fields: React.ReactNode[]
  actions: React.ReactNode[]
  customFieldSkeletonProps?: PreloadSkeletonProps
}

const CryptoDepositOptionView: React.FC<CryptoDepositOptionViewProps> = ({
  cashierOption,
  loading,
  qr,
  fields,
  actions,
  customFieldSkeletonProps,
}) => {
  const classes = useDepositTabStyles({ qr })

  return (
    <>
      <div className={classes.rootOption}>
        <div className={classes.mainContentContainer}>
          {!!qr && (
            <PreloadSkeleton
              loading={loading}
              component={qr}
              options={{ width: 68, height: 68 }}
            />
          )}
          <div className={classes.FieldsContainer}>
            {fields?.length &&
              fields
                .filter(Boolean)
                .map((field, i) => (
                  <PreloadSkeleton
                    loading={loading}
                    key={i}
                    component={field}
                    options={{ height: cashierOption.crypto ? 20 : 45 }}
                    {...customFieldSkeletonProps}
                  />
                ))}
          </div>
        </div>
      </div>
      <div className={classes.BottomButtons}>
        {actions?.length && actions.map(action => action)}
      </div>
    </>
  )
}

export default React.memo(CryptoDepositOptionView)
