#!/usr/bin/env bash

set -euo pipefail

NOW=$(date +%s)
SECRETS=$(kubectl get externalsecret | awk '{print $1}' | tail +2)

function check-refreshed() {
    attempts=1
    max_attempts=10
    refreshed=false
    while [[ "$refreshed" == false && "$attempts" -lt "$max_attempts" ]]; do
        echo "Waiting for all secrets to be refreshed"
        refreshed=true
        for secret in ${SECRETS[@]}; do
            # Describe output isn't valid yaml, need to strip Annotations before parsing Refresh Time
            refresh=$(kubectl describe externalsecret $secret | sed '/Annotations:/d'| yq e '.Status.["Refresh Time"]' -)
            refreshEpoch=$(TZ="UTC" echo "${refresh}" | awk -F '[-T:]' '{print mktime($1" "$2" "$3" "$4" "$5" "$6)}')
            if [[ $refreshEpoch < $NOW ]]; then
                echo "${secret} not refreshed: ${refreshEpoch}"
                refreshed=false
            fi
        done
        
        ((attempts++))
        sleep 20
    done

    if [[ "$refreshed" == false ]]; then
        echo "Secrets not refreshed"
        exit 1
    fi
}

function refresh-secrets() {
    echo "Forcing secrets refresh"
    for secret in ${SECRETS[@]}; do
        kubectl annotate es $secret force-sync=$NOW --overwrite
    done

    echo "Waiting for all secrets to be refreshed"
    sleep 60
}

function roll-deployments() {
    api_deployments=$(kubectl get deployments | awk '{print $1}' | tail +2 | grep 'api')
    worker_deployments=$(kubectl get deployments | awk '{print $1}' | tail +2 | grep 'w-')

    echo "Rolling api deployments"
    for deployment in ${api_deployments[@]}; do
        kubectl rollout restart deployment/$deployment
    done

    sleep 30

    echo "Rolling worker deployments"
    for deployment in ${worker_deployments[@]}; do
        kubectl rollout restart deployment/$deployment
    done
}

refresh-secrets
check-refreshed
roll-deployments
