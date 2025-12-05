# Named Lock

## Version 1

This version uses RethinkDB.
This utility is used as a distributed mutex for critical sections, mostly for idempotent transactions.

**Note:** This module is deprecated. New uses of this module should not be added and existing uses should be migrated to a new system such as a wrapper around RedLock.

## Version 2

This utility has replaced RethinkDB with MongoDB to create a better controlled Mutex lock for **certain** use cases.

### When Should You Use This Lock

Use this lock when:

1. Correctness is the most important criteria for your lock

- correctness means that a lock prevents more than one process from acting on a piece of data

2. When multiple processes are trying to act on a piece of data in MongoDB

- This lock _can_ be used for other use-cases, but this use-case is what the lock is best for.

### How To Use This Lock

1. Import and instantiate the MongoMutexLock Interface in your module.

- Extend the class in your module for more specific functionality, otherwise use it as is.

2. Acquire the lock at the start of your process and then Remove the lock when your process completes.
3. Be sure to pass in an expiration time in MS when acquiring the lock. This acts as a **fail-safe**, in case the lock is not removed properly from (2).

- MongoDB will delete the lock at your set expiration time, within about a minute of accuracy.
