#!/bin/sh
set -eu
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

echo "Building…"
npx esbuild src/index.ts --bundle --minify --outfile=public/code.js $@
