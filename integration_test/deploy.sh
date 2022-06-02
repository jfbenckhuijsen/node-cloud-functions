#!/usr/bin/env bash

echo "Deploying function $2 from directory $1. Trigger will be: $3 $4"

cd $1
gcloud functions deploy $2 --runtime nodejs16 --allow-unauthenticated $3 $4 > deploy_result.log

grep "  url" deploy_result.log | awk '{print $2}' > deploy_url

cd ..
