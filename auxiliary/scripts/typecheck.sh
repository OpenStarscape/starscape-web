#!/bin/sh
set -eou pipefail
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

printf "Typechecking... "
npx tsc --strict --noEmit
echo "success!"
