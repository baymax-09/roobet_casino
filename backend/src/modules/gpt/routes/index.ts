import express from 'express'

import { type RouterApp, api } from 'src/util/api'

import { offerPipeline } from '../lib'
import { gptLogger } from '../lib/logger'

export default function (app: RouterApp) {
  const router = express.Router()
  app.use('/gpt', router)

  /*
   * router.get('/admin/gptPipeline', api.check, adminMidWare.modAdmin, async function(req, res) {
   *   validatedApiCall(req, res, async function(args) {
   *     return await getGptPipeline()
   *   })
   * });
   */

  /*
   * router.post('/admin/gptPipeline/payout', api.check, adminMidWare.modAdmin, async function(req, res) {
   *   validatedApiCall(req, res, async function(args) {
   *     await isBanned(req)
   *     return await manuallyPayoutOffer(args.offerId)
   *   })
   * });
   */

  /*
   * router.post('/admin/gptPipeline/reject', api.check, adminMidWare.modAdmin, async function(req, res) {
   *   validatedApiCall(req, res, async function(args) {
   *     return await manuallyRejectOffer(args.offerId)
   *   })
   * });
   */

  /*
   * router.get('/history', api.check, async function(req, res) {
   *   validatedApiCall(req, res, async function(args) {
   *     const history = await getGptHistoryForUser(req.user.id)
   *     const pipeline = await getGptPipelineForUser(req.user.id)
   *
   *     return { history, pipeline }
   *   })
   * })
   */

  router.get(
    '/webhook/offer998822638261298379',
    api.asyncCallback(async (req, res) => {
      res.json(1)
      try {
        await offerPipeline(req.query)
      } catch (error) {
        gptLogger('/webhook/offer998822638261298379', {
          userId: req.user?.id ?? null,
        }).error('GPT pipeline error', { req }, error)
      }
    }),
  )
}
