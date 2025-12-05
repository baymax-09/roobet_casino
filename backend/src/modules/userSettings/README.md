# User Settings

1. user editable user settings
2. staff editable user feature access control

1 and 2 share collections/interfaces which they probably should not!
We control the schema of these user settings in `src/modules/userSettings/lib/settings_schema.ts`.
All functions provided for interacting with user system settings derive their types from this object.
