# Campaigns

This is a internal module to manage the integration of our application with the Unibo opt-in API integration.

- Api documentation: https://docs.unibo.com/p/aCFUHfWIoIn0Pn/API-Based-Opt-in

## Overview

1. User makes a GET request to our API endpoint: `/_api/campaigns/opt-in/?....`

2. If user is unauthenticated, redirect to homepage login `frontendBase/?modal=auth&tab=login` with a redirect_url param leading back to this endpoint.

3. Once the user is authenticated, perform checks on the query parameters.

   - If campaign_id || redirect_url are missing from params, redirect to homepage

4. Use the query paramers to attempt opting the user into the particular campaign

5. Redirect the user to the redirec_url regardless of the outcome of the opt-in response from Unibo.

## Testing

The following urls show the expected shapes that are meant for use with this endpoint.

#### Local

`pambet.test/_api/campaigns/opt-in?campaign_id=272&redirect_url=http://pambet.test/tag/slots`

#### Staging

`777.dev/_api/campaigns/opt-in?campaign_id=272&redirect_url=https://777.dev/casino?category=slots`

`777.dev/_api/campaigns/opt-in?campaign_id=272&redirect_url=https://777.dev/_api/towers/gameboardLayout`

## Flow Chart

https://miro.com/app/board/uXjVKdMLmUU=/
