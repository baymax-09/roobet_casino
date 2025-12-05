export type IOResult<O, E extends Error> =
  | {
      success: true
      error: undefined
      result: O
    }
  | {
      success: false
      error: E
      result: undefined
    }
