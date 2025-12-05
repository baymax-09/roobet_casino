# GraphQL API

This module contains our Admin GraphQL API.

## Principles

Please refer to these principles when designing types and fields for GQL.

- [Apollo GQL Operations Best Practices](https://www.apollographql.com/docs/react/data/operation-best-practices/)
- Name operations in the pattern <entity><verb> (e.g. `playerTagCreate` instead of `createPlayerTag`)
  - This allows related fields/types to be grouped in imports, exports, file tree, schema, declarations, etc.
- Do not share type and field definitions between the graphs, even if something seems the same they are not by the fact that they exist in multiple graphs.

## Generated Files

Nexus generates a schema file and a declaration file for each graph.
These are generated at run time so make sure to run backend after any GQL changes and before pushing.
The schema file is currently unused but the declaration files are used by TypeScript.
