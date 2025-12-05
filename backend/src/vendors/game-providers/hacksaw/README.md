# Hacksaw Gaming

## Starting a Session

A session, or a game instance, is started using the `tpGameStartGame` mutation defined in the `tp-games` module.

## Finite State Machine

We are leveraging [xstate](https://xstate.js.org/docs/about/concepts.html) to model and execute incoming
Hacksaw actions (callbacks). Below is a visualization of our current machine with includes all states, events and actions.

The state machine lets us cleanly handle events in order, regardless of the order in which we receive them. A long
term goal is to refactor the existing providers to use a very similar (if not the same) machine. The actions will differ,
but the states should be the same.

The state machine can be found here: [fsm.ts](./lib/fsm.ts)

## How to test

```sh
ngrok http --subdomain=elder2 3003
```

Test any Hacksaw game
