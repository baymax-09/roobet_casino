# GPT

## How the system works

The main file is `lib/gpt/index.js` which contains the offer pipeline. Offers come in from `/gpt/webhook/...` as GET requests.

We start by detecting which network the offer comes from (req.query.network), then we load the plugin for that network.

We use the network plugin to decode the request into an offer object and then run it through the pipeline.

If the offer has an `id` specified, no two offers of the same id can be processed.
This is used to prevent duplicates and very important. On many services it would be called
the `transactionId` parameter

First step is validation of the offer.
This ensures that the offer is authenticated and not invalid.
We have both a global validation check for all networks and a local validation check for the loaded plugin/network.

The next step is fraud detection. This ensures that users arent frauding offers.
There is both a global fraud process and a local one defined by the plugin.

The next step is to payout the offer and move it from the `gpt_pipeline` table to `gpt_history`.
We pay out `offer.value` so make sure it's calculated correctly.

Usually the ad network will send something like `req.query.vc_value` to specify the value the offer is worth.
Make sure that when you parse this number you specify the result in US DOLLARS (invalid units will absolutely kill us as a business - triple check your work!)

If an offer gets held, there are some admin panel routes to `/admin/gptPipeline` for admins and `admin/gptPipeline/payout` + `admin/gptPipeline/reject` - this allows admins to send offers through the pipeline that were previously held.

So now that you have an overview of the system

## Building a plugin

How to build a plugin:

```sh
ngrok http 3003
```

### Registering your postback/webhook on the GPT website

Take the URL and put it into the postback/webhook section of your gpt site (for instance adscendmedia.com -> login -> postbacks -> add postback)

You should be able to test postbacks from their UI. We assume they come in as GET requests to /gpt/webhook/klfj.....

Add a file for the network as a plugin to `lib/plugins` directory and register the plugin in `lib/plugins/index.js`

The main gpt system (`gpt/lib/index.js`) will load your plugin by looking at the `network` field coming in from the postback/webhook.

So for instance if the webhook goes to `dsfkljdsjflk.ngrok.io/gpt/webhook/kflfksdjjkdfsljdsflkjfdlksjfdslkj?network=test` it would load the `gpt/lib/test.js` plugin

Currently each plugin has to export 3 functions -

- buildfOffer
- pluginOfferValidate
- pluginFraudCheck

### BuildOffer

`buildOffer` takes as an input the `req.query` object (aliased to `postbackFields`) and returns both a `user` object and an `offer` object.

The offer schema can be seen by looking @ `gpt_history` on prod. It should also be documented in `gpt/lib/plugins/test.js#buildOffer` as the test plugin is the prototype for all other plugins.

Very important - adding the `id` field allows you to prevent offers from being spammed/duplicates getting processed.
So if your GPT site has a `transactionId`, you probably want to alias it to the `id` field so the offer cant be processed multiple times.

`value` is how much the offer is going to pay out, `offerId` and `network` describe where the offer came from, and of course you can specify a `description`

It is important that if your offer sp

### pluginOfferValidate

This function is used to validate whether the offer should be processed. we return a pipeline action (defined in gpt/lib/index.js) which defines
whether we should continue processing the offer or not.
This would be the place to put some validation on the server IPs, secret keys, etc.

If it's invalid, return `{ nextAction: PipelineActions.Abort }`` to abort processing of the offer (for instance if it fails a security check)

### pluginFraudCheck

This is where you might do something specific to your plugin to check for fraud. the global fraud check is in `lib/fraud.js` but networks sometimes require particular treatment.

For instance if you want to hold all offers for `network='test'` where the value is greater than $1, you might type

```js
if (value > 1) {
  return { nextAction: PipelineActions.Hold }
}
```
