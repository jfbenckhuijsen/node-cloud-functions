#!/usr/bin/env bash

cd $1
gcloud alpha functions deploy $2 --stage-bucket $3 --trigger-http > deploy_result.log

grep "  url" deploy_result.log | awk '{print $2}' > deploy_url

cd ..
