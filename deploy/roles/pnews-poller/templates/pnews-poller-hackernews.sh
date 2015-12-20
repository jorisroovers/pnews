#!/bin/bash

export NODE_ENV="production"
export MONGO_DB_URL="{{pnews_poller_mongo_url}}"

cd "{{pnews_poller_dir}}"
/usr/bin/node app.js --source hackernews
