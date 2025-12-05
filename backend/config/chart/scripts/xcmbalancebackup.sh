#!/usr/bin/env bash

set -euo pipefail

curl --location --request POST "https://shield.gandalf.pw/admin/reporting/webhook?token=${USER_EXPORT_TOKEN}" \
    --header 'Content-Type: application/json' \
    --data-raw '{
        "report": "userBalances",
        "params": {}
    }'
