# Rain

## Overview

- A user or an admin can create a Rain pot for a specified amount
- A countdown initiates til the Rain is active, the default countdown is 1 minute
- The rain moves to Active and users can join the Rain
- At the end of the Rain the users each get an equal share of the pot divided by the number of people who joined. This may change to be weighted towards VIP users.

## Routes

### /admin/create

This route is used if an admin wants to make a Rain, it won't pull money from them and will allow them to customize countdown and active time

### /create

This is for users to create, the default values for countdown and active time will be used, they will need to specify an amount

### /active

This can be used with the Rain Feed to notify users who sign on to the site during an active rain, that there is an active rain.

### /joinRain

This adds the user's id to the list of usersEnteredRain in the database, and it takes a recaptcha and a rainId

## Additional Info

- Rains always have one of 3 statuses, specified as imported constants (RainStatus.Active, RainStatus.Countdown, RainStatus.Ended)
- usersShareOfRain object in the database keeps track of who got how much for that rain
