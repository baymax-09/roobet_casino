# Roobet Routes

The app uses a custom react-router switch; this enables us to control route transitions.

The custom switch and context can be found [here](./LazyRouter/index.js).

There are two use cases where we want to delay/control transitions:

1. Lazy-loading bundle chunks
2. Delaying route switching until an api call is complete

In order to signify a route is lazy, set the `lazy` property to `true`. There are examples of this in our [`Routes.tsx`](./Routes.tsx) file.

Lazy routes (both use cases) MUST call the `done()` method provided by [`GeneralLoadingContext`](../context/loading.context.tsx) for the route transition to complete.

Two helpers have been created to assist with this:

1. [`useLazyRoute`](../hooks/useLazyRoute.ts) hook
2. [`asLazyRoute`](../util/lazy.ts) route middleware

## Notes

- The lazy route may be rendered (and hidden) before the transition is complete. This may have some implications for certain use cases. For example, an immediate animation may need to be delayed until after the transition is complete. The `loading` property provided by the `LazeRouterContext` may be useful.
