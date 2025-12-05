export function getLatestHotboxGame(r: any) {
  return r
    .table('hotbox_games')
    .orderBy({ index: r.desc('index') })
    .limit(1)
}
