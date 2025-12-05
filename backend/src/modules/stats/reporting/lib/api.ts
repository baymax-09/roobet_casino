export type MaybeAsync<T> = T | Promise<T>

export type Resolve<T> = T extends Promise<infer Return> ? Return : T

// Intentionally simple params interface.
export type ReportParams = object
export type ReportOutput = any | undefined

export interface Report {
  readonly run: (params: any) => MaybeAsync<ReportOutput>
  readonly afterRun?: (params: any, output: ReportOutput) => MaybeAsync<void>
}

export type Reports = Record<string, Report>

export const report = <P extends ReportParams, O extends ReportOutput>(report: {
  run: (params: P) => MaybeAsync<O>
  afterRun?: (params: P, output: O) => MaybeAsync<void>
}) => report

export const reports = <R extends Reports>(reports: R): R => reports
