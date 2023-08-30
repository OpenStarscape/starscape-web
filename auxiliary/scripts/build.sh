#!/bin/bash
set -eu
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

echo "Building…"
npx esbuild src/index.ts --bundle --minify --outfile=public/code.js $@
npx esbuild src/test/integrationTests.ts --bundle --minify --outfile=public/test.js $@
npx esbuild src/extras/projectTasks.ts --bundle --minify --outfile=public/tasks.js $@
