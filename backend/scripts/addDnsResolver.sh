#!/bin/bash

# Add DNS resolver file to etc

echo "You may be prompted to enter your password to continue. This script will write a resolver file to /etc/resolvers"

# On macOS, the resolver dir does not exist by default.
sudo mkdir -p /etc/resolver

# Copy resolver file to /etc/resolver/
sudo cp ./local/config/dnsmasq/pambet.test /etc/resolver/
sudo cp ./local/config/dnsmasq/pambet.wow /etc/resolver/

printf "The resolver has been copied. You can remove it by running ./scripts/removeDnsResolver.sh\n"