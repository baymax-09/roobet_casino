#!/bin/bash

read_var() {
  VAR=$(grep $1 $2 | xargs)
  IFS="=" read -ra VAR <<< "$VAR"
  echo ${VAR[1]}
}

ENVIRONMENT=$(read_var ENVIRONMENT .env)

verify_dev() {
  if [ "$ENVIRONMENT" != "dev" ]; then
    echo "This script may only be run in the 'dev' environment."
    exit 1;
  fi
}