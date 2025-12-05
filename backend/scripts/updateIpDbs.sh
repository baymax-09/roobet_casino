#!/bin/bash

# Downloads the most recent IP2Proxy BIN database and checks it into the repo.
# This can only be done 5 times per hour before we are rate limited.
set -e

ip2Url="https://www.ip2location.com/download?token=er8efGHQVw5NqPhcP4TkLscvtaLcGFJCBW0lBcJj0or5xNgFdmOl53H3FAqf87r6"
ip2RegionDBUrl="https://www.ip2location.com/downloads/ip2location-iso3166-2.zip"

this_script_dir="$(cd "$(dirname "$0")" && pwd)"
project_dir="$this_script_dir/.."
artifacts_dir="$project_dir/artifacts"

declare -a bin_paths=("DB3BINIPV6 ipGeo.bin IPV6-COUNTRY-REGION-CITY.BIN")

download_bin() {
    echo "Downloading $1"
    # set file destination and name
    fileDest="${artifacts_dir}/${2}"
    # file being extracted from the .zip
    fileToExtract=$3
    # temp zip file name
    zip_temp_dest="${fileDest}.tmp.zip"
    curl -o "${zip_temp_dest}" "$ip2Url&file=$1" &> /dev/null
    unzip -p $zip_temp_dest $fileToExtract > $fileDest
    echo "unzip successful"
    rm $zip_temp_dest
}

download_region_csv() {
  echo "Downloading ISO DB"
  curl -o "ip2location-iso3166-2.tmp.zip" "$ip2RegionDBUrl" &> /dev/null
  unzip -p "ip2location-iso3166-2.tmp.zip" "IP2LOCATION-ISO3166-2.CSV" > "${artifacts_dir}/iso3166-2.csv"
  echo "unzip iso region successful"
  rm "ip2location-iso3166-2.tmp.zip"
} 

read -p "Running this script will download the latest version of
the IP2Location proxy BIN file to your working directory.

Are you sure? Y/n " -n 1

printf "\n\n"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Make artifact dir if it doesn't already exist
    mkdir -p $artifacts_dir

    # Download file to destination.
    printf "Downloading bin file from IP2Location...\n"

    # Paid databases.
    for (( i=0; i<${#bin_paths[@]}; i++ ))
    do
      set -- ${bin_paths[$i]}
      download_bin $1 $2 $3
    done

    # Free region database.
    download_region_csv

    printf "Download completed.\n"
fi
