#!/bin/bash

confirm() {
  msg="$1

Are you sure you want to continue? Y/n "

  read -p "$msg" -n 1
  printf "\n"

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    printf "\n"
  else
      exit 0
  fi
}