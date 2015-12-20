#!/bin/bash

export NODE_ENV="production"
export MONGO_DB_URL="{{pnews_poller_mongo_url}}"
export REDDIT_USERNAME="{{pnews_poller_reddit_username}}"
export REDDIT_PASSWORD="{{pnews_poller_reddit_password}}"
export REDDIT_APP_ID="{{pnews_poller_reddit_app_id}}"
export REDDIT_APP_TOKEN="{{pnews_poller_reddit_app_token}}"

cd "{{pnews_poller_dir}}"
/usr/bin/node app.js --source reddit
