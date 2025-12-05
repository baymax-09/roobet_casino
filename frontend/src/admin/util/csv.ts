import csv from 'papaparse'

export type ParsedCsvRow<Columns extends boolean> = Columns extends true
  ? Array<Record<string, string | number>>
  : string[]

export const parseCsvFile = <
  C extends Array<{ name: string; type: string }> | undefined,
  Row = ParsedCsvRow<C extends undefined ? false : true>,
>(
  file: File,
  columns: C,
): Promise<Row[]> => {
  const reader = new FileReader()

  return new Promise((resolve, reject) => {
    reader.onload = evt => {
      const contents = evt.target?.result?.toString()

      if (!contents) {
        reject('Failed to read file contents.')
        return
      }

      const result = csv.parse<Row>(contents, {
        header: !!columns,
        skipEmptyLines: 'greedy',
        transform: (value, field) => {
          if (!columns) {
            return value
          }
          const col = columns.find(({ name }) => name === field)

          if (col?.type === 'number') {
            return parseFloat(value)
          }

          return value
        },
      })

      resolve(result.data)
    }

    reader.readAsText(file)
  })
}
