#!/bin/sh
set -eou pipefail
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

echo "Building..."
npx esbuild src/index.ts --bundle --minify --sourcemap --outfile=public/code.js
