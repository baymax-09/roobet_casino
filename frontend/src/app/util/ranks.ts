export const getColorFromRankName = rankName => {
  if (rankName === 'Pebble') {
    return 'rgb(109, 120, 130)'
  }
  if (rankName === 'Stone') {
    return '#9da1ad'
  }
  if (rankName === 'Bronze') {
    return 'rgb(175, 152, 37)'
  }
  if (rankName === 'Silver') {
    return '#80a5ff'
  }
  if (rankName === 'Gold') {
    return '#ddb43f'
  }
  if (rankName === 'Platinum') {
    return 'rgb(177, 118, 249)'
  }
  if (rankName === 'Diamond') {
    return 'rgb(249, 118, 134)'
  }
  if (rankName === 'Diamond Elite') {
    return 'black'
  }
}
