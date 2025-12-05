export const withUserIdOrName = otherColumns => {
  const columns = [
    {
      name: 'userId',
      label: 'User ID/Username',
      type: 'string',
      options: {
        customBodyRender: (value, { rowData, columnIndex }) => {
          const usernameIndex = columns.findIndex(
            col => col.name === 'username',
          )

          if (!value && usernameIndex) {
            return rowData[usernameIndex]
          }

          return value
        },
      },
    },
    {
      name: 'username',
      label: 'Username/User ID',
      type: 'string',
      options: {
        display: 'excluded',
      },
    },
    ...otherColumns,
  ]

  return columns
}

export const downloadPath = (path: string, nameOverride?: string) => {
  const link = document.createElement('a')
  link.href = path

  if (nameOverride) {
    link.download = nameOverride
  }

  // This is necessary as link.click() does not work on some browsers.
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  )

  setTimeout(() => {
    link.remove()
  })
}
