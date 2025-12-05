# Logger

We leverage Winston for our logging needs and we have written an structured logging wrapper to standardize log shape.
We call `scopedLogger` with a module name, this returns a function we can use to instantiate a logger with a scope and context.
This logger instance has chainable logging functions corresponding to the Winston Node.js severities/log levels(except `http`):

0. `error`
1. `warn`
2. `info`
3. ~~`http`~~
4. `verbose`
5. `debug`
6. `silly`

Each of the log level functions accepts a message string and optional metadata and returns a reference to the logger so that it can be created and used in the same line if necessary.

An example usage looks like:

```typescript
const authLogger = scopedLogger('auth')

const testFunc = (user: User): bool => {
  const logger = authLogger('testFunc', { userId: user.id }).info(
    'entered test func',
  )

  const whichProblem = problemWithUser(user)
  if (whichProblem) {
    logger.warn('Problem with user', { whichProblem })
  }
}
```

## TODO

- remove the Winston export from `src/system/index.ts`
- remove the Winston export from `winston.ts`
