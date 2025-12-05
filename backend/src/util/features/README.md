# Features

This utility module provides infrastructure for feature flags.

Feature flags should not be used to provide the long term ability to toggle systems/features on the site. See the `systems` module for that.

## Steps for adding feature flag checks

1. Add the name of your feature to the `type FeatureName`.
2. Append new feature name to the `userAccess` record in the `determineUserFeatureAccess` function.
3. Create if block around portion of code that you want to be enabled/disabled. Use `determineSingleFeatureAccess`.
4. `feature_flag` record will have to be manually created in stage/prod for enablling/disabling.
