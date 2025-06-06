#!/bin/bash

source scripts/shellUtils.sh

# Check if jq is installed
if ! jq --version > /dev/null 2>&1; then
  error 'jq is not installed. Please install jq and try again' >&2
  exit 1
fi

if [[ ! -d Mobile-Expensify ]]; then
    echo false
    exit 0
else
    cd Mobile-Expensify || exit 1
fi

# Check if 'package.json' exists
if [[ -f package.json ]]; then
    # Read the 'name' field from 'package.json'
    package_name=$(jq -r '.name' package.json 2>/dev/null)

    # Check if the 'name' field is 'mobile-expensify'
    if [[ "$package_name" == "mobile-expensify" ]]; then
        echo true
        exit 0
    else
        echo "The package name is incorrect. It should be 'mobile-expensify'. Script will assume the standalone NewDot app."
        echo false
        exit 0
    fi
else
    echo "package.json not found in Mobile-Expensify"
    echo false
fi
