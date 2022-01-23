#!/bin/sh
set -eou pipefail
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

SERVER_PATH="auxiliary/starscape-server"

# If there is no server available, give instructions for setting it up
if ! test -e "$SERVER_PATH"; then
  if test -L "$SERVER_PATH"; then
    echo "ERROR: $SERVER_PATH is a broken symlink to $(readlink "$SERVER_PATH")"
  else
    echo "ERROR: $SERVER_PATH does not exist"
  fi
  echo
  echo "If you have not already, clone and build the server:"
  echo "  cd .."
  echo "  git clone git@github.com:OpenStarscape/starscape-server.git"
  echo "  cd starscape-server"
  echo "  cargo build"
  echo "  cd ../$(basename "$PWD")"
  echo
  echo "Once you have the server built, symlink the binary to $SERVER_PATH. for example:"
  echo "  ln -sf $(dirname "$PWD")/starscape-server/target/debug/starscape-server $SERVER_PATH"
  exit 1
fi

COMMAND="$SERVER_PATH \
--http-static-content=./public \
--http-type=http \
--http-port=56560 \
--http-loopback=false \
--open-browser=true\
"
echo "> $COMMAND"
$COMMAND
