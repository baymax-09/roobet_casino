/**
 * This is the official list of files remaining with type errors.
 *
 * DO NOT:
 *   - add directories to this list
 *   - add created files to this list
 *   - add existing files that have a type error introduced
 *   - add new exempted error codes to codes lists
 *
 * Fix the type errors you introduce! Do not ts-expect-error or tsc-silent them!
 */
module.exports = {
  suppress: [
    {
      pathRegExp:
        'src/admin/routes/BulkRoutes/BulkGameImages/BulkGameImages.tsx',
      codes: [2769, 2339, 2345],
    },
    {
      pathRegExp:
        'src/admin/routes/InventoryRoute/HouseInventoryRoute/HouseInventoryRoute.tsx',
      codes: [2322, 2339, 18048],
    },
    { pathRegExp: 'src/app/lib/sound.ts', codes: [2339] },
    { pathRegExp: 'src/app/util/dom.ts', codes: [2322] },
    { pathRegExp: 'src/app/util/paymentiq.ts', codes: [2322] },
    { pathRegExp: 'src/app/util/store.ts', codes: [2339, 2554] },
    {
      pathRegExp:
        'src/common/components/ConfirmDialogProvider/ConfirmDialogProvider.tsx',
      codes: [2322, 2739],
    },
    {
      pathRegExp: 'src/common/components/UserProvider/UserContext.ts',
      codes: [2554],
    },
    { pathRegExp: 'src/common/polyfill.ts', codes: [2322] },

    // Just let these ride until they are deleted...
    {
      pathRegExp: 'src/app/components/Roowards/Reload.tsx',
      codes: [2339, 18047, 2698],
    },
    {
      pathRegExp: 'src/app/components/Crash/crashEngine.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/app/components/Crash/CrashGraph/index.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/app/routes/ColorsRoute/Animation/index.ts',
      codes: [2339, 2551, 2322, 2531, 2345],
    },
    {
      pathRegExp: 'src/app/routes/ColorsRoute/ColorsBetControls/index.ts',
      codes: [2339],
    },
    {
      pathRegExp: 'src/app/routes/ColorsRoute/ColorsBets/ColorsBet.tsx',
      codes: [2322],
    },
    {
      pathRegExp: 'src/app/routes/ColorsRoute/ColorsBets/index.ts',
      codes: [2339],
    },
    {
      pathRegExp: 'src/app/routes/ColorsRoute/ColorsHistory/index.ts',
      codes: [18046],
    },
    {
      pathRegExp: 'src/app/routes/ColorsRoute/ColorsRoute.tsx',
      codes: [2339, 2322, 2741],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/BetControls.tsx',
      codes: [2345, 2339, 2322, 2551, 18046],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/BettingStrategy.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/context.tsx',
      codes: [2554, 2339],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/CrashEngine.ts',
      codes: [2551, 2339],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/CrashHistory.tsx',
      codes: [2339, 2345],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/CrashRoute.tsx',
      codes: [2322, 2339, 18047, 2698, 18048, 2345, 2769],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/objects/AxisMarker.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/objects/CashoutPoint.ts',
      codes: [2339, 2551, 2322, 2531, 18047],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/objects/PlayerBet.ts',
      codes: [2339, 2322],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/objects/PlayerBets.ts',
      codes: [2339, 2322, 2551],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/objects/Rocket.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/PlayerList.tsx',
      codes: [2339, 2322, 2345],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/views/ActiveView.ts',
      codes: [2339, 2551, 2554],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/views/LoadingView.ts',
      codes: [2339],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/views/StartingView.ts',
      codes: [2339],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/views/View.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/app/routes/CrashRoute/views/ViewManager.ts',
      codes: [2339, 2551],
    },
    {
      pathRegExp: 'src/admin/routes/MessagingRoute/MessageSend/MessageSend.tsx',
      codes: [2741],
    },
    {
      pathRegExp: 'src/admin/routes/MessagingRoute/MessageTabs/MessageTabs.tsx',
      codes: [2339],
    },
    {
      pathRegExp: 'src/vendors/leon.ts',
      codes: [2630, 2695, 1345, 2683, 2345, 2554, 2322, 2339, 18048, 2774],
    },
  ],
}
