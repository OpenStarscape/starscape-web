#!/bin/sh
set -eu pipefail
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

npx jest --config ./src/jest/jest.config.json
