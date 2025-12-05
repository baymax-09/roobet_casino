import * as aws from 'aws-sdk'

import { config } from 'src/system'

export function initializeAWS() {
  const { creds } = config.amazon

  // TODO: Determine if this is actually doing anything.
  // @ts-expect-error we should probably pass Promise into this
  aws.config.setPromisesDependency()

  // If aws credentials have been provided, configure the SDK.
  // By default the SDK will use the credentials chain to search
  // multiple sources. On local, this will be your shared
  // credentials file store in ~/.aws.
  // @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html'
  if (creds.accessKeyId && creds.secretAccessKey) {
    aws.config.update(creds)
  }
}
