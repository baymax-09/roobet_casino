declare global {
  /**
   * A SIGTERM has been sent to the process, clean up what you're doing.
   * @todo make readonly, app code should not set this.
   */
  var SHUTTING_DOWN: boolean | undefined

  /** Something is broken and cannot be resolved, fail k8s heath checks. */
  var DEPLOYMENT_UNAVAILABLE:
    | {
        reason: string
      }
    | undefined
}

// Have to export something for this to get picked up
export {}
