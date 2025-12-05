import React from 'react'
import { useTheme } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import Pagination from '@mui/material/Pagination'

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      '& .MuiPagination-ul': {
        flexWrap: 'nowrap',
      },
    },
  }),
)

const TablePaginationActions = props => {
  const theme = useTheme()
  const classes = useStyles(theme)
  const { count, page, rowsPerPage, onPageChange } = props

  const onChange = (event, value) => {
    onPageChange(event, value - 1)
  }

  return (
    <Pagination
      className={classes.root}
      count={Math.ceil(count / rowsPerPage)}
      page={page + 1}
      boundaryCount={2}
      siblingCount={2}
      onChange={onChange}
      showFirstButton={true}
      showLastButton={true}
    />
  )
}

export default React.memo(TablePaginationActions)
