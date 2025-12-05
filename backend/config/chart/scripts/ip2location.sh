#!/usr/bin/env bash

set -euo pipefail

cd $DATA_DIR

function extract_databases() {
    echo "extracting ISO3166"

    unzip -p ISO3166-2.zip IP2LOCATION-ISO3166-2.CSV > iso3166-2.csv.new

    echo "extracting DB3BINIPV6"

    unzip -p DB3BINIPV6.zip IPV6-COUNTRY-REGION-CITY.BIN > ipGeo.bin.new

    rm -f *.zip
}

function get_dependencies() {
    apk update
    apk add jq
}

function get_dataabases() {
    echo "downloading ip2location databases"

    for file in DB3BINIPV6; do
        wget -O ${file}.zip "${BASEURL}?token=${IP2LOCATION_TOKEN}&file=${file}"
    done

    if [ ! -z "$(grep 'NO PERMISSION' DB3BINIPV6.zip)" ]; then
        echo "permission denied"
        exit 1
    fi

    if [ ! -z "$(grep '5 times' DB3BINIPV6.zip)" ]; then
        echo "download quota exceed"
        exit 1
    fi

    wget -O ISO3166-2.zip "${ISO3166_2_URL}"

    echo "databases downloaded successfully"
}

function restart_workloads() {
    echo "restarting workloads"

    for workload in api api-callbacks api-graphql api-wss; do
        kubectl rollout restart deployment -l app=${workload}
    done

    echo "workloads restarted"
}

function replace_databases() {
    echo "replacing databases"

    mv ipGeo.bin.new ipGeo.bin
    mv iso3166-2.csv.new iso3166-2.csv
}

function update_checksums() {
    echo "updating checksums"

    if sha256sum -c checksums.txt; then
        echo "no changes required, exiting..."
        exit 0
    fi

    sha256sum *.zip > checksums.txt

    echo "checksums updated"
}

get_dependencies
get_dataabases
update_checksums
extract_databases
replace_databases
restart_workloads
