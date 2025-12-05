export const columns = [
  {
    label: 'ID',
    name: 'id',
    options: {
      filter: true,
      display: true,
      sort: true,
    },
  },
  {
    label: 'Name',
    name: 'name',
    options: {
      filter: true,
      display: true,
      sort: true,
    },
  },
  {
    label: 'Description',
    name: 'description',
    options: {
      filter: true,
      display: true,
      sort: true,
    },
  },
  {
    label: 'Type',
    name: 'type',
    options: {
      filter: true,
      display: true,
      sort: true,
    },
  },
]

export const data = [...new Array(10)].map((_, index) => {
  return {
    id: index,
    name: `name ${index}`,
    description: `test description ${index}`,
    type: `type ${index}`,
  }
})
