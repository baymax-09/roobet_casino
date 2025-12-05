# Raffles v2

The `raffle` module provides functionality for our regular and advent calendar raffle events.

## Creating a new raffle

This module exposes as `POST` endpoint at `/raffle` which takes a payload in the following format:

```json
{
  "name": "Example Christmas Raffle",
  "type": "advent",
  "start": "2021-11-30",
  "end": "2021-12-31",
  "slug": "christmas-2021",
  "ticketsPerDollar": "0.1",
  "winnerCount": "3",
  "payouts": ["Plane", "Boat", "Car"],
  "modifiers": [
    {
      "type": "gameIdentifier",
      "identifiers": [
        {
          "id": "123",
          "title": "roulette"
        }
      ],
      "ticketsPerDollar": "0.2"
    }
  ]
}
```

The raffle will display on the frontend if the `start` date has passed and `archived` is falsy.

## Raffle types

The raffle types definitions are located in `src/modules/raffle/lib/types`. Each type can have it's own rakeback
and bet modifier rules. A raffle type _MUST_ have corresponding templates (banner, page) on frontend. If no templates exist,
the bet will not render.

At the time of writing, these types have been implemented:

- default
- advent

## Updating a raffle

Similar to creating a raffle, you can update a raffle by `PATCH`ing the `/raffle/:id` endpoint. The endpoint accepts
a partial of the create payload and will only update the supplied properties. This action is useful for marking the raffle
as archived or updating the configuration.

## Picking winners

To draw the winners for a raffle, `POST` the `/raffle/:id/drawWinners` endpoint with no request body. This
will pick winners and save them to the `winners` array on the raffle document. The raffle will continue to display
on frontend until the `archived` property is set to `false`.
