#!/usr/bin/env bash

set -euo pipefail

declare -r BUCKET="s3://$1"
declare -r DATADIR=${DATADIR:-/tmp/data}
declare -r OUTDIR="${DATADIR}/rethinkdb"

tables=(
    active_bet
    active_cash_dash_games
    active_jungle_mines_games
    active_mines_games
    active_towers_games
    bans
    crash_games
    crash_hashes
    deposit_transactions
    email_verifications
    exchange_rates
    gpt_history
    gpt_pipeline
    hotbox_games
    hotbox_hashes
    ipBanlist
    migrations
    named_mutex
    promo_codes
    rains
    roulette_games
    roulette_hashes
    settings
    stats
    user_passwords
    user_system_settings
    user_wallet_transactions
    user_wallets
    users
    withdrawals
)

function clean() {
    rm -rf "${DATADIR}"/*
    mkdir -p "${OUTDIR}"
}

function rethinkdb-dump() {         
    cd "${DATADIR}" || exit 1

    for table in "${tables[@]}"
    do
        echo "Exporting table: $table"
        
        dump_command="rethinkdb dump \
        --clients ${CLIENTS:-${CPU_REQUEST:-1}} \
        --connect ${RETHINKDB_HOST:-localhost}:${RETHINKDB_PORT:-28015} \
        --export atlanta.${table} \
        --file ${table}.tar.gz --temp-dir ${DATADIR}"

        eval "$dump_command"
    done
}

function extract() {
    for table in "${tables[@]}"
    do
        tar -x \
        --directory "$OUTDIR" \
        --file ${table}.tar.gz \
        --gunzip \
        --strip 2 \
        --verbose
    done
}

function sync-storage() {
    cd "${OUTDIR}" || exit 1

    for file in *
    do
        aws s3 cp $file "$BUCKET/rethinkdb/atlanta/"
    done
}

trap clean EXIT

clean
rethinkdb-dump
extract
sync-storage
