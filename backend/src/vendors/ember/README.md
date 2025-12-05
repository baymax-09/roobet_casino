# Ember - accountRoute

This README provides an overview of the process flow for ember account linkage and balance transfer processes.

## Path

`backendBase/_api/ember`

## Endpoint Description

1. `/linkAccount`: Internal endpoint responsible for validation and creation of a `emberLinkedAccount` document within the Roobet database. Initialized by frontend in response to authentication with the `emb` query parameter.

2. `/transfer`: External endpoint responsible for validation and application of a balance transfer. Initialized by ember in order to issue a balance transfer to a known `emberLinkedAccount`.

## Process Flow

1. User is directed to Roobet with a link containing `emb` query parameter. The value of the emb parameter is an AES encrypted json body of the form `{ ember_user_id: <UUID> }`

2. Once the user has been authenticated, the application will make a POST to `/linkAccount` with the encrypted emb parameter.

3. The `/linkAccount` route validates the shape and encryption of the `ember_user_id`, and attempts the `createEmberAccount` Database method.

- linkedAccount documents are indexed by a unique combination of roobet userId and ember userId.

4. In response to successful emberAccount document creation, the application proceeds to confirming the account linkage via PUT request to `https://api.emberfund.io/roobet/users`.

   - The put request body is a json stringified body containing `emberUserId` and `roobetUserId`, encrypted via AES using a shared secret and randomized initialization vector.

5. In response to an error in either the document creation method or the confirmLink method, the application will delete the linkedAccount document in order to prevent possible issues with duplicates.

6. If an error is thrown specifying that the account has already been linked, only this error will bubble to the user as feedback, all other error states are silent for the user.

## Error Handling

- If the user's authentication token is invalid or expired, the server responds with a 401 Unauthorized error.

- If the service provider details are invalid or cannot be verified, the server responds with a 400 Bad Request error.

- If any other unexpected errors occur during the process, the server responds with a 500 Internal Server Error.

- General response structure: `{ success: boolean, detail?: string }`

## Testing info

For testing:

- Test emberID: `ember_user_id: "2b9d315c-bf2c-4489-877b-ec68af64ccbb"`
- ember_user_id encrypted to emb query param: `38db78bf65e2f31eabd82029707f3dc03221898b80580b9011498d5b32f64a2067320755cc88e8ca0a9a4c6c364063b54520ac0eac1c933e66e84a06349835d5:315bcb96a91ed3c8`
  - this encrypted string was generated with the a temporary encryption key for testing: `IT_MUST_BE_THIRTY_TWO_CHARACTERS`
