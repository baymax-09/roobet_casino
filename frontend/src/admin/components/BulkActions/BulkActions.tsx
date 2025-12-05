import React, { type ReactNode } from 'react'
import { Typography, CircularProgress } from '@mui/material'
import MUIDataTable, {
  type MUIDataTableColumn,
  type MUIDataTableOptions,
} from 'mui-datatables'
import useCsvDownloader from 'use-csv-downloader'

import { api, indexBy, mapObjectToTypes } from 'common/util'
import { useConfirm, useToasts } from 'common/hooks'
import { parseCsvFile, type ParsedCsvRow } from 'admin/util'
import { TitleContainer } from 'mrooi'

import { validate } from './validators'

import { useBulkActionsStyles } from './BulkActions.styles'

interface BulkActionResponse {
  responses: any[]
  errors: Array<{ error: string; data: object }>
  successes: any[]
}

interface BulkActionsViewProps {
  id: string
  title: string
  endpoint: string
  columns: Array<{
    name: string
    label?: string
    type: string
    options?: MUIDataTableColumn['options'] & {
      validate?: (data: unknown) => boolean
    }
  }>
  downloadExample?: () => void
  parseInputFile?: (file: File) => Promise<Array<ParsedCsvRow<true>>>
  copy?: {
    upload?: () => string
    example?: () => string
    exampleData?: any[]
    instructions?: string[]
  }
  ignoreAllColumnsFilled?: boolean
  customBodyContent?: ReactNode
  allowCSVUpload?: boolean
  prependActionButtons?: ReactNode[]
  bodyParams?: Record<string, any>
}

const BulkActionsView: React.FC<BulkActionsViewProps> = props => {
  const classes = useBulkActionsStyles()
  const confirm = useConfirm()
  const { toast } = useToasts()
  const inputFileRef = React.useRef<HTMLInputElement>(null)
  const csvDownloader = useCsvDownloader({ quote: '' })
  const columnsByName = indexBy(props.columns, 'name')
  const { allowCSVUpload = true } = props
  const [data, setData] = React.useState<Array<ParsedCsvRow<true>>>([])
  const [loading, setLoading] = React.useState(false)
  const [invalidCells, setInvalidCells] = React.useState({})

  const { updatedColumns } = React.useMemo(() => {
    const updatedColumns = props.columns.map(column => {
      return {
        ...column,
        options: {
          ...column.options,
          customBodyRender: (data, key) => {
            const hasErrors = column?.options?.validate
              ? !column.options.validate(data)
              : column.name === key.columnData.name &&
                !validate(data, column.type)

            const rendered =
              'customBodyRender' in (column.options ?? {})
                ? // @ts-expect-error this interface is wrong
                  column.options?.customBodyRender?.(data, key)
                : data

            if (hasErrors && !props.ignoreAllColumnsFilled) {
              setInvalidCells(prevState => ({
                ...prevState,
                [`${key.columnIndex}:${key.rowIndex}`]: true,
              }))

              return (
                <div className={classes.cell_error_background}>{rendered}</div>
              )
            }
            // bulk image uploads
            if (typeof data === 'object') {
              return [...Object.keys(data), Object.values(data)].join(': ')
            }

            return rendered
          },
        },
      }
    })

    return { updatedColumns }
  }, [props.columns, data])

  const downloadCsv = (data, name) => {
    csvDownloader(data, `${props.id}-${name}.csv`)
  }

  const downloadExampleCSV = () => {
    if (typeof props.downloadExample === 'function') {
      props.downloadExample()
      return
    }

    if (props.copy?.exampleData) {
      downloadCsv(props.copy?.exampleData, 'sample')
      return
    }

    // Else, download sample data.
    downloadCsv([mapObjectToTypes(columnsByName)], 'sample')
  }

  const tableOptions = React.useMemo<MUIDataTableOptions>(
    () => ({
      filter: true,
      filterType: 'dropdown',
      download: false,
      print: false,
      selectableRows: 'none',
    }),
    [],
  )

  const onImport = () => {
    inputFileRef.current?.click()
  }

  const onClear = () => {
    setData([])
    setInvalidCells({})
    if (inputFileRef.current) {
      inputFileRef.current.value = ''
    }
  }

  const onFileChange = async event => {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    if (typeof props.parseInputFile === 'function') {
      setData(await props.parseInputFile(file))

      return
    }

    const data = await parseCsvFile(file, props.columns)

    setData(data)
  }

  const onUpload = () => {
    confirm({
      title: 'Confirm Upload',
      message: 'Are you sure you want to continue with the bulk import?',
    }).then(() => {
      setLoading(true)

      api
        .post<any, BulkActionResponse>(props.endpoint, {
          data,
          ...props.bodyParams,
        })
        .then(response => {
          setLoading(false)

          if (response.responses && response.responses.length) {
            // In this case we do not want to report an error, but it should return multiple responses per line.
            toast.success(
              `Imported ${
                response.responses.length +
                response.errors.length +
                response.successes.length
              } rows! Downloading a CSV with a list of ${
                response.responses.length
              } responses.`,
            )
            downloadCsv(response.responses, 'bulk-upload-result')
          } else if (response.errors && response.errors.length > 0) {
            toast.error(
              `Imported ${response.successes.length} out of ${
                response.errors.length + response.successes.length
              } rows! Downloading a CSV with a list of errors.`,
            )
            const errorFields = response.errors.map(({ error, data }) => ({
              error,
              ...data,
            }))
            downloadCsv(errorFields, 'bulk-upload-errors')
          } else {
            toast.success('Import completed!')
          }
        })
        .catch(err => {
          setLoading(false)
          if (err.response.data === 'Please try again later') {
            err.message = 'Server Timeout'
          }
          toast.error(`Import failed: ${err.message}`)
        })
    })
  }

  const numInvalidCells = Object.keys(invalidCells).length

  return (
    <TitleContainer
      title={`Bulk ${props.title} Upload`}
      prependActionButtons={props.prependActionButtons}
      actions={() => [
        ...(data.length === 0
          ? [
              {
                value: props.copy?.example
                  ? props.copy.example()
                  : 'Example CSV',
                variant: 'contained' as const,
                onClick: () => downloadExampleCSV(),
              },
            ]
          : []),
        ...(data.length > 0
          ? [
              {
                value: `Import ${data.length} row(s)`,
                variant: 'contained' as const,
                onClick: () => onUpload(),
              },
            ]
          : []),
        ...(!data.length && allowCSVUpload
          ? [
              {
                value: props.copy?.upload ? props.copy.upload() : 'Upload CSV',
                variant: 'contained' as const,
                onClick: () => onImport(),
              },
            ]
          : []),
        ...(data.length > 0
          ? [
              {
                value: 'Clear',
                variant: 'contained' as const,
                onClick: () => onClear(),
              },
            ]
          : []),
      ]}
    >
      <input
        ref={inputFileRef}
        onChange={onFileChange}
        type="file"
        style={{ display: 'none' }}
      />

      {props.copy?.instructions && (
        <>
          <Typography variant="h5">Instructions</Typography>
          {props.copy.instructions.map((note, index) => (
            <Typography key={index} variant="body1">
              - {note}
            </Typography>
          ))}
        </>
      )}
      {numInvalidCells > 0 && (
        <Typography variant="h5" className={classes.invalid_column_text}>
          Import has {numInvalidCells} invalid column(s). Please check your
          column cells before importing.
        </Typography>
      )}

      <MUIDataTable
        options={tableOptions}
        columns={updatedColumns}
        data={data}
        title={
          <Typography variant="h6">
            {loading && (
              <>
                Loading...
                <CircularProgress
                  color="primary"
                  size={24}
                  style={{ marginLeft: 15, position: 'relative', top: 4 }}
                />
              </>
            )}
          </Typography>
        }
      />
      <p>{props.customBodyContent}</p>
    </TitleContainer>
  )
}

export const BulkActions = React.memo(BulkActionsView)
