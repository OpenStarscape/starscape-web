#!/bin/sh
set -eu
if ! test -f package.json; then echo "Script run from $PWD, not project root"; exit 1; fi

SERVER_PATH="auxiliary/starscape-server"

COLOR_RED='\x1b[31;1m'
COLOR_GREEN='\x1b[32;1m'
COLOR_GRAY='\x1b[37;2m'
COLOR_NONE='\x1b[0m'

# If there is no server available, give instructions for setting it up
if ! test -e "$SERVER_PATH"; then
  printf "$COLOR_RED%s$COLOR_NONE" "error "
  if test -L "$SERVER_PATH"; then
    echo "is a broken symlink to $(readlink "$SERVER_PATH")"
  else
    echo "$SERVER_PATH does not exist"
  fi
  echo
  printf "%s$COLOR_GREEN%s$COLOR_NONE%s\n" "If you have not already, " "clone and build the server" ":"
  printf "$COLOR_GRAY"
  echo "  cd .."
  echo "  git clone git@github.com:OpenStarscape/starscape-server.git"
  echo "  cd starscape-server"
  echo "  cargo build"
  echo "  cd ../$(basename "$PWD")"
  printf "$COLOR_NONE"
  echo
  printf "%s$COLOR_GREEN%s$COLOR_NONE%s\n" "Once you have the server built, " "symlink the binary to $SERVER_PATH" ". for example:"
  printf "$COLOR_GRAY"
  echo "  ln -sf $(dirname "$PWD")/starscape-server/target/debug/starscape-server $SERVER_PATH"
  printf "$COLOR_NONE"
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
