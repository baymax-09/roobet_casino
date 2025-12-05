# Event Scheduler

Event scheduler used to programmatically schedule jobs to occur in the future. Leverages Mongo to store events and publishes the jobs through our RMQ job queue system.

## Event Scheduler and Job Queue improvements

- add to job queue interface for hooking into job events `completed`, `drained`, `failed`
