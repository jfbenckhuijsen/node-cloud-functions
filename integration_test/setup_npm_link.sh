#!/usr/bin/env bash

PWD=$(pwd)

echo "Linking CloudServant in $2"

cd  $1 && cd $2 && npm link $3 && cd $PWD || exit 1
