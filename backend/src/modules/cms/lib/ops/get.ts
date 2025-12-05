import puppeteer from 'puppeteer-core'
import { type Request, type Response } from 'express'

import { config } from 'src/system'
import { APIValidationError } from 'src/util/errors'
import { cmsLogger } from '../logger'

import { getCmsDocument } from '../../documents'

export const get = async (req: Request) => {
  const { name, lang } = req.params
  if (!lang || (lang && typeof lang !== 'string')) {
    throw new APIValidationError('language must be a string')
  }

  const doc = await getCmsDocument(name, lang)

  if (!doc) {
    throw new APIValidationError('No such document.')
  }

  return doc
}

export const getUserCMSContent = async (req: Request) => {
  const { name, lang } = req.params
  let doc
  if (!lang || (lang && typeof lang !== 'string')) {
    throw new APIValidationError('language must be a string')
  }

  doc = await getCmsDocument(name, lang)

  if (!doc) {
    doc = await getCmsDocument(name, 'en')
  }

  return doc
}

export const download = async (req: Request, res: Response) => {
  const { name, lang } = req.params

  if (lang && typeof lang !== 'string') {
    throw new APIValidationError('lang must be a string')
  }

  const doc = await getCmsDocument(name, lang)

  if (!doc || !doc.content_html) {
    throw new APIValidationError('Cannot find CMS document.')
  }

  try {
    const pdfBuffer = await htmlToPDF(doc.content_html)

    res.set({
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename=${doc.title}.pdf`,
      'content-transfer-encoding': 'binary',
    })
    res.status(200).send(pdfBuffer)
  } catch (error) {
    cmsLogger('download', { userId: null }).error(
      'Error loading PDF',
      { name, lang },
      error,
    )
    throw new APIValidationError('Unable to load PDF')
  }
}

const htmlToPDF = async (html: string) => {
  // Because we had to use an older version of puppeteer(7.0.1) there is no supported type library

  const browser = await puppeteer.launch({
    executablePath: config.chromiumBinPath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--no-zygote',
    ],
  })

  // create a new page
  const page = await browser.newPage()

  // set the content html content from our db
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  // create a PDF buffer from our page content
  const pdfBuffer = await page.pdf()
  // close our headless browser
  await browser.close()
  return pdfBuffer
}
