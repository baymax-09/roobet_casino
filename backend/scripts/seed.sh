#!/bin/bash

# Seed rethink and mongo databases with fresh data.

data_file="$1"

if ! test -f "$data_file"; then
    printf "A valid seed file is required.\n"
    exit 1
fi

project_dir="./"
this_script_dir="$(cd "$(dirname "$0")" && pwd)"

confirm_msg="Running this script will truncate all rethink and mongo collections,
run the database migration, and seed sample data."

source $this_script_dir/lib/verify_dev.sh
source $this_script_dir/lib/confirm.sh

# This may only be run on dev.
verify_dev

# Confirm that this will wipe local database.
confirm "$confirm_msg"

# Hide node process warning output.
export NODE_NO_WARNINGS=1

npx ts-node --project ./node.tsconfig.json -r dotenv/config --transpile-only "$project_dir/scripts/seed.ts" $data_file

artifact="$project_dir/artifacts/ipGeo.bin"

if [[ ! -e $artifact ]]
then
    confirm "You are missing an IP2 DB, download them?"
    $this_script_dir/updateIpDbs.sh
fi
