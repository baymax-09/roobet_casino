#!/usr/bin/env bash
set -euxo pipefail

declare -r PROJECT=$1
declare -r GCS_BUCKET=$2
declare -r DATADIR=/tmp/export
declare -r TABLES=(
    active_bet
    users
    bans
    promo_codes
    user_system_settings
    user_wallets
    chat_history
)

trap 'rm -rf $DATADIR' EXIT ERR SIGTERM
cd /tmp

gcloud auth activate-service-account --key-file "$GOOGLE_APPLICATION_CREDENTIALS" --quiet

while true; do
    find $DATADIR -type f -exec truncate -s0 {} \; || true
    rm -rf $DATADIR
    for table in "${TABLES[@]}"; do
        (
            rethinkdb export \
            --clients 4 \
            --connect "${RETHINKDB_HOST}:28015" \
            --directory "${DATADIR}/${table}" \
            --export "atlanta.${table}" \
            --format json
            
            jq -r '
        .[] | (.createdAt?.epoch_time? // 0) as $createdAt | . + with_entries(
          select(.value.epoch_time?) | .value |= (.epoch_time | todate)
        ) | [
          .id,
          @json,
          ($createdAt | todate | sub("^(?<date>.*)T(?<time>.*)Z"; "\(.date) \(.time)+00")),
          (now | todate | sub("^(?<date>.*)T(?<time>.*)Z"; "\(.date) \(.time)+00"))
        ] | @csv
            ' "$DATADIR/$table/atlanta/${table}.json" > "$DATADIR/$table.csv"
            
            (truncate -s 0 "$DATADIR/$table/atlanta/${table}.json" && rm -rf "${DATADIR:?}/$table") &
            
            gsutil cp "$DATADIR/$table.csv" "gs://${GCS_BUCKET}/${table}.csv"
            
            (truncate -s 0 "${DATADIR}/${table}.csv" && rm -f "${DATADIR}/${table}.csv") &
            
            bq load \
            --project_id "${PROJECT}" \
            --dataset_id "${PROJECT}":rethinkdb \
            --location europe \
            --replace \
            --source_format CSV \
            --schema 'id:STRING,data:JSON,createdAt:TIMESTAMP,syncedAt:TIMESTAMP' \
            "rethinkdb._${table}_raw" \
            "gs://${GCS_BUCKET}/${table}.csv" &
            
            wait # for table-level background processes to complete
        ) &
    done
    
    wait # for all background processes to complete
done
