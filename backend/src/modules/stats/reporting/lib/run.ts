import { type Reports, type Resolve } from './api'

/**
 * Run a report given the specified input.
 *
 * The typing on this is complex, but allows us to have autocomplete
 * and expected return types based on string paramters.
 */
export const run =
  <R extends Reports>(reports: R) =>
  async <S extends keyof R>(
    report: S,
    params: Parameters<R[S]['run']>[0],
  ): Promise<{
    result: ReturnType<R[S]['run']>
    definition: R[S] & {
      afterRun?: (
        params: Parameters<R[S]['run']>[0],
        contents: Resolve<ReturnType<R[S]['run']>>,
      ) => void
    }
  }> => {
    const definition = reports[report]

    // Resolve report result.
    const result = await definition.run(params)

    // Return result and any remaining report configuration.
    return { result, definition }
  }
