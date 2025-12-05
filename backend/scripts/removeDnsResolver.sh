#!/bin/bash#!/bin/bash

# Remove DNS resolver file from /etc/resolvers

echo "You may be prompted to enter your password to continue. This script will remove the resolver file from /etc/resolvers"

sudo rm /etc/resolver/pambet.test

echo "The resolver has been remove. You can add it back by running ./scripts/addDnsResolver.sh\n"
