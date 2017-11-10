#!/usr/bin/env bash

echo "Deploying function $2 from directory $1. Trigger will be: $4 $5"
echo "Using stage bucket $3 for deployment"

cd $1
gcloud alpha functions deploy $2 --stage-bucket $3 $4 $5 > deploy_result.log

grep "  url" deploy_result.log | awk '{print $2}' > deploy_url

cd ..
