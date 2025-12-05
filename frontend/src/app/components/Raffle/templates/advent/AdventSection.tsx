import React, { type CSSProperties } from 'react'
import clsx from 'clsx'

import { type AdventSectionImageConfig } from './AdventRafflePage'

import { useAdventSectionStyles } from './AdventSection.styles'

type AdventSectionProps = React.PropsWithChildren<{
  gridArea: CSSProperties['gridArea']
  images?: AdventSectionImageConfig[]
  className: string
}>

export const AdventSection: React.FC<AdventSectionProps> = ({
  gridArea,
  images = [],
  children,
  className,
}) => {
  const classes = useAdventSectionStyles({
    gridArea,
  })

  return (
    <section className={clsx(classes.AdventSection, className)}>
      {images.length > 0 && (
        <div className={classes.AdventSection__imageContainer}>
          {images.map(image => (
            <div
              key={image.key}
              className={classes.ImageContainer__image}
              style={{
                ...(image.styles || {}),
                backgroundImage: `url(${image.src})`,
              }}
            />
          ))}
        </div>
      )}

      {children}
    </section>
  )
}

export default React.memo(AdventSection)
