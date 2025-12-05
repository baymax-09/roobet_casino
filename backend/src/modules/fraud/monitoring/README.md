# Fraud Monitoring

This module includes business logic for monitoring fraud.

## Anomaly Detection Worker

This worker queries views in the `alerts` BigQuery dataset on a predetermined interval to detect anomalies. If rows are returned, alerts are sent and actions can be taken (disable games, lock users, etc).
