import { r } from 'src/system'
import { type CrashGame } from '../../documents/crash_game'

export function getLatestCrashGame() {
  return r
    .table<CrashGame>('crash_games')
    .orderBy({ index: r.desc('index') })
    .limit(1)
    .run()
}
