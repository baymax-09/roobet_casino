# Github Configuration

This directory holds configuration files used by Github.

## Workflows & Actions

The workflows in this repository consume composite actions from a shared, private repo in our organization called [gh-actions](https://github.com/project-atl/gh-actions).

The `GH_ACTIONS_DEPLOY_KEY` secret must be set. This is a deploy key for the `gh-actions` repository that permits Github Actions to pull (read only) the shared configuration.
