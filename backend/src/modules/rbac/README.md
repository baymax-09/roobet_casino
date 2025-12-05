# RBAC (Role-based Authorization Control)

RBAC is a method of authorization control that relies on a user's role in the organization to control what that user can do.
Instead of directly requiring specific roles to perform certain actions, resources are protected by a resource/action pair and roles have a list of allow/deny effected resource/action pairs associated with them.

## Terms

- Resource: a thing that can be affected by a user action (e.g. `account`, `deposit`).
- Action: something that can happen to a resource (e.g. `create`, `read`, `update`, `delete`).
- Resource-Action Pair: a tuple of a resource and an action that can be performed on it (e.g. `account:read`, `deposit:update`).
- Effect: the affect a policy can have on a resource-action pair: `allow` or `deny` (e.g. `DENY account:read`, `ALLOW deposit:update`).
- Policy: a name, an effect, and list of rules.
- Role: a name, a slug, and a list of policies.

## Caching

When fetching RBAC data for the ACP it is queried from Mongo.
When fetching RBAC data for permitted actions(or updating RBAC data), we use Redis as a write through cache in the documents files.
Please be cognizant of which use case you are modifying and pay attention to the cache.

## Future Improvements

- [ ] fix dupes in resource/action names
- [ ] remove `userIds` from roles schema
- [ ] consolidate API into GQL(some is in Express still)
- [ ] when a role is deleted, remove it from users so we don't accidentally assign a new role of the same name to a bunch of users
- [ ] make role slugs not editable since that is how we associate users with roles?
- [ ] REACH GOAL: migrate from resource-action pairs to resource paths `account:read_fasttrackEmails` => `account.fasttrackEmails:read`
