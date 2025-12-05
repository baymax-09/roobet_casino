//  A place to manage media (uploading, downloading, deleting).
import aws from 'aws-sdk'

import { config, initializeAWS } from 'src/system'

import { type Readable } from 'stream'

type UploadDestinations = 'verification' | 'publicImages' | 'adminReports'

export const UPLOAD_DESTINATIONS: Record<
  UploadDestinations,
  {
    bucket: string
    domain?: string
    conditions: Array<Record<string, any> | [string, any, any]>
  }
> = {
  verification: {
    bucket: config.verification.storage.bucket,
    conditions: [
      // Content-Type restriction is specified as a Bucket Policy in AWS
      ['starts-with', '$Content-Type', ''],
      ['content-length-range', 0, 5000000], // 0 - 5 MB
    ],
  },
  publicImages: {
    bucket: config.media.destinations.publicImages.bucket,
    domain: config.media.destinations.publicImages.domain,
    conditions: [
      ['starts-with', '$Content-Type', 'image/'],
      ['content-length-range', 0, 4000000], // 0 - 4 MB
    ],
  },
  adminReports: {
    bucket: config.reporting.bucket,
    conditions: [['eq', '$Content-Type', 'text/csv']],
  },
}

const S3Client = (() => {
  initializeAWS()
  const s3 = new aws.S3({
    signatureVersion: 'v4',
    region: config.amazon.defaultRegion,
  })
  return s3
})()

export const media = {
  download: async ({
    dest,
    path,
  }: {
    dest: UploadDestinations
    path: string
  }): Promise<Buffer | undefined> => {
    const params = {
      Bucket: UPLOAD_DESTINATIONS[dest].bucket,
      Key: path,
    }

    try {
      const result = await S3Client.getObject(params).promise()

      if (!result.Body) {
        return undefined
      }

      if (Buffer.isBuffer(result.Body)) {
        return result.Body
      }

      return Buffer.from(result.Body.toString())
    } catch {
      return undefined
    }
  },

  upload: async ({
    dest,
    path,
    contents,
  }: {
    dest: UploadDestinations
    path: string
    contents: Buffer | Readable | string
  }): Promise<void> => {
    const params = {
      Bucket: UPLOAD_DESTINATIONS[dest].bucket,
      Key: path,
      Body: contents,
    }

    await S3Client.putObject(params).promise()
  },

  delete: async ({
    dest,
    path,
  }: {
    dest: UploadDestinations
    path: string
  }): Promise<void> => {
    const params = {
      Bucket: UPLOAD_DESTINATIONS[dest].bucket,
      Key: path,
    }

    await S3Client.deleteObject(params).promise()
  },

  getPublicUrl: ({
    dest,
    path,
  }: {
    dest: UploadDestinations
    path: string
  }): string => {
    const { bucket, domain } = UPLOAD_DESTINATIONS[dest]

    if (domain) {
      return `${domain}/${path}`
    }

    return `https://${bucket}.s3.amazonaws.com/${path}`
  },

  generatePresignedPost: async (
    destination: UploadDestinations,
    path: string,
    expiration?: number,
  ) => {
    const { bucket, conditions } = UPLOAD_DESTINATIONS[destination]
    return S3Client.createPresignedPost({
      Bucket: bucket,
      Fields: { key: path },
      Expires: expiration ?? 60 * 5, // Expire URL after 5 minutes
      Conditions: conditions,
    })
  },
}
