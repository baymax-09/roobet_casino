# User

## Avatars

API calls:
`POST /user/avatar/setPreferred { type }` - sets a preferred type of avatar to user
`POST /user/avatar/setCustom { url }` - sets a user avatar from url

Avatar should be updated everytime a user logs in + every time a user updates their email.
Avatars currently come from gravatar for "email" type

When a user has their avatar set to email and they log in through google, facebook, etc via oauth, it will automagically set their preferred
avatar to that oauth type

example avatar sub-object on user:

```
"avatars": {
"custom":  "" ,
"email": https://www.gravatar.com/avatar/e1cd7829234906eae2de3933049d7b0a,
"google": https://lh3.googleusercontent.com/-EpA9Cie8Nzc/AAAAAAAAAAI/AAAAAAAAK2Y/4qAGjQsAbuc/photo.jpg?sz=50,
"preferred":  "google" ,
} ,
```
