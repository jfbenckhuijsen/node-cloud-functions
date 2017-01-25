#!/usr/bin/env bash

DEPLOY_URL=`cat deploy_url`
curl -X POST $DEPLOY_URL -H "Content-Type:application/json" --data '{"name":"Keyboard Cat"}'
