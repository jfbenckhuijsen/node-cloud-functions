#!/usr/bin/env bash

DEPLOY_URL=`cat deploy_url`
curl -X POST ${DEPLOY_URL}/path1 -H "Content-Type:application/json" --data '{"name":"Keyboard Cat"}'
curl -X GET ${DEPLOY_URL}/path1 -H "Content-Type:application/json"
curl -X POST ${DEPLOY_URL}/path2 -H "Content-Type:application/json" --data '{"name":"Keyboard Cat"}'
curl -X POST ${DEPLOY_URL}/parampath/test2 -H "Content-Type:application/json" --data '{"name":"Keyboard Cat"}'
