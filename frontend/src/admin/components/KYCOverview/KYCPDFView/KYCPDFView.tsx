import React from 'react'
import { usePdf } from '@mikecousins/react-pdf'

import { useKYCPDFViewStyles } from './KYCPDFView.styles'

interface KYCPDFViewProps {
  documentUrl: string
}

export const KYCPDFView: React.FC<KYCPDFViewProps> = ({ documentUrl }) => {
  const classes = useKYCPDFViewStyles()

  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const { pdfDocument } = usePdf({
    page: 1,
    canvasRef,
    file: documentUrl,
    withCredentials: true,
  })

  return (
    <div>
      {!pdfDocument ? (
        <span>Loading...</span>
      ) : (
        <canvas className={classes.documentPDFPreview} ref={canvasRef} />
      )}
    </div>
  )
}
