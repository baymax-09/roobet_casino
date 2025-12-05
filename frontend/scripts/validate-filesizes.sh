#!/usr/bin/env bash

#  Functional declarations.
format() { declare -n __p="$1"; for k in "${!__p[@]}"; do printf "%s %skB\n" "$k" "${__p[$k]}" ; done ;  }  

# Global variable declarations.
declare -A paths=()
declare -A offenders=()

####  Add new path matching and max size in kB here. ####
paths["^assets\/.+\.(png|jpg|jpeg)$"]=500
paths["^assets\/.+\.svg$"]=50

# List all files touched in branch.
files=($1)

# Loop through every touched file.
for file in "${files[@]}" ; do

    # Loop through all paths.
    for path in "${!paths[@]}" ; do

      # If Regex doesn't match, skip.
      if [[ ! "$file" =~ $path ]]; then
        continue
      fi

      # Calculate filesize in Kb.
      size=$(du -k $file | awk '{print $1}' )
      max_size=${paths[$path]}

      # If size is equal or smaller to max, skip.
      if [ $max_size -ge $size ]; then
        # Uncomment to debug. 
        # printf "$file ($size kB) is less than $max_size kB max, skipping.\n"
        continue
      fi

      # Add to list of offenders.
      offenders[$file]=$size
  done
done

# If not offenders, exit 0.
if [ "${#offenders[@]}" -eq 0 ]; then
  printf "\nNo oversize assets founds.\n"
  exit 0
fi

# Print offenders, exit with 1.

printf "\nOne or more files is over the asset size limit.\n\n"
printf "Limits:\n"
format paths

printf "\nFiles:\n"
format offenders
exit 1
