#!/bin/bash

diff_keys=$(comm -23 <(sort .env.template) <(sort .env))

keys_array=()
while IFS= read -r line; do
    if [[ -n $line ]]; then  # Check if the line is non-empty
        keys_array+=("$line")
    fi
done <<< "$(echo "$diff_keys" | awk -F '=' '{print $1}')"

# Check if the array has elements
if [ ${#keys_array[@]} -gt 0 ]; then
  echo "You environment mods are:"
    # Iterate over the array only if there are elements
    for key in "${keys_array[@]}"; do
        env_value="${!key:-MISSING CONFIG}"
        echo "$key=\"$env_value\""
    done
else
    echo "Your env file is identical to the template."
fi
