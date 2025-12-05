import React, { useRef, type ChangeEvent } from 'react'

interface FileSelectProps {
  id: string
  required?: boolean
  children: ({ handleClick }: { handleClick: () => void }) => React.ReactNode
  onFileChange: (file: File) => void
  style?: React.CSSProperties
}

const FileSelect: React.FC<FileSelectProps> = ({
  id,
  required = false,
  children,
  onFileChange,
  style,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target?.files?.[0]) {
      onFileChange(event.target.files[0])
    }
  }

  return (
    <>
      {children({ handleClick })}
      <input
        required={required}
        id={id}
        name={id}
        type="file"
        ref={fileInputRef}
        style={{ display: 'none', ...style }}
        onChange={handleFileChange}
      />
    </>
  )
}

export default FileSelect
