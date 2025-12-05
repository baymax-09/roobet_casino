# OAuth

## Instructions

The instructions below will describe the OAuth flow for each provider.

### Google

Callbacks from the Google OAuth server end up at `/google/callback`, and are then redirected to `/google/redirectCallback`.
The reason for this redirect is that there is no guarantee the callback location is on the same host as the client, so we need to redirect to the client's hosts so we can persist cookies.

#### Google Login

Initiated via the `/google` route.

Our system will determine the associated account via the unique ID associated with the account (`google` field in RDB `user_passwords` collection).
If an associated Roobet account is not found, this should error.

#### Google Linking

Initiated via the `/google/link` route.

Exactly the same as login, except the `linking` session field is set to `true`, which necessitates a current user session.
This will associate the OAuth account with the current user if the OAuth account is not associated with any other user.

#### Google Signup

Initiated via the `/google` route when the `signup` URI param is present.

This is the same logic as login, except it does not expect an existing user.

### Facebook

Callbacks from the Facebook OAuth server end up at `/facebook/callback`, and are then redirected to `/facebook/redirectCallback`.
The reason for this redirect is that there is no guarantee the callback location is on the same host as the client, so we need to redirect to the client's hosts so we can persist cookies.

#### facebook login

Initiated via the `/facebook` route.

This prompts a request to Facebook's OAuth server via passport authentication.
Our system will determine the associated account via the unique ID associated with the account (`facebook` field in RDB `user_passwords` collection).
If an associated Roobet account is not found, this should error.

#### Facebook Linking

Initiated via the `/facebook/link` route.

Exactly the same as login, except the `linking` session field is set to `true`, which necessitates a current user session.
This will associate the OAuth account with the current user if the OAuth account is not associated with any other user.

### Metamask

This provider doesn't use callbacks like Google or Facebook, and instead the auth flow is between the client's Metamask extension and the backend managing a nonce for a user.

`/metamask/link/nonce` is used to get the current user nonce when the user is logged in, and `/metamask/nonce` is used when there is no current user session.
These routes will generate a new nonce every time they are called, since a nonce should only be used once per authentication.

The frontend acquires the nonce for the current wallet address, and then creates a signature using a hex-encoded message and the current wallet address.
The address and signature are all passed to the backend, which reconstructs the original wallet address using `@metamask/eth-sig-util`, and compares it to the address passed in.
If they match, then the user is authenticated. This is cryptographically secure, because the signature guarantees access to the given wallet address.

These nonces are also invalidated after OAuth authentication is complete.

#### Metamask Login

Initiated via the `/metamask` route.

Sends a signature, address, and encoded message to the server. Our system will determine the associated account via the wallet address associated with the account (`metamask` field in RDB `user_passwords` collection).
If an associated Roobet account is not found, this should error.

#### Metamask Linking

Initiated via the `/metamask/link` route.

Exactly the same as login, except the `linking` session field is set to `true`, which necessitates a current user session.
This will associate the OAuth account with the current user if the OAuth account is not associated with any other user.

## 2FA

When you call `/account/login` it returns ` { token, twofactorRequired[boolean] }` if the user has twofa enabled you'll see it.

Alternatively when you call another oauth, you will see a cookie called `token` and `twofactorRequired`

If you dont have `twofactorRequired` you should be able to call any route passing that token and you're good to go

If you do have `twofactorRequired` you need to then call `GET /auth/validate2faForToken?currentToken=xyz&twofactorCode=xyz`

That will return `{ newToken }` which you can use to auth. make sure you clear the cookie
