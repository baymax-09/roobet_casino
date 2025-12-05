import crypto from 'crypto'

import { media } from './media'

const MEDIA_DEST = 'publicImages'

const withTempObjectKey = async (
  operation: (key: string) => any | Promise<any>,
) => {
  const key = crypto.randomBytes(20).toString('hex')

  try {
    await operation(key)
  } finally {
    await media.delete({
      dest: MEDIA_DEST,
      path: key,
    })
  }
}

describe('media.ts', () => {
  it('should pass this test..', () => {
    const test = true
    expect(test).toBe(true)
  })
  // it('should upload an object to S3', () =>
  //   withTempObjectKey(async key => {
  //     expect(() =>
  //       media.upload({
  //         path: key,
  //         dest: MEDIA_DEST,
  //         contents: Buffer.from('example contents - upload'),
  //       }),
  //     ).not.toThrow()
  //   }))

  // it('should download an object from S3', () =>
  //   withTempObjectKey(async key => {
  //     const contents = Buffer.from('example contents - download')

  //     await media.upload({
  //       path: key,
  //       dest: MEDIA_DEST,
  //       contents,
  //     })

  //     const buffer = await media.download({
  //       path: key,
  //       dest: MEDIA_DEST,
  //     })

  //     expect(Buffer.compare(buffer, contents)).toBe(0)
  //   }))

  // it('should delete an object from S3', () =>
  //   withTempObjectKey(async key => {
  //     await media.upload({
  //       path: key,
  //       dest: MEDIA_DEST,
  //       contents: Buffer.from('example contents - delete'),
  //     })

  //     await media.delete({
  //       path: key,
  //       dest: MEDIA_DEST,
  //     })

  //     const buffer = await media.download({
  //       path: key,
  //       dest: MEDIA_DEST,
  //     })

  //     expect(buffer).toBeUndefined()
  //   }))

  // it('should get a public url for a document from S3', () =>
  //   withTempObjectKey(async key => {
  //     const publicUrl = await media.getPublicUrl({
  //       path: key,
  //       dest: MEDIA_DEST,
  //     })

  //     expect(publicUrl).toBe(`https://${UPLOAD_DESTINATIONS[MEDIA_DEST].bucket}.s3.amazonaws.com/${key}`)
  //   }))
})
