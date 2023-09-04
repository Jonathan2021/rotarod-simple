#!/bin/sh
env="development"
if [ $# == 1 ]; then
    env=$1
fi
NODE_ENV=$env ./node_modules/.bin/ts-node -T server/databaseInit.ts
pm2 delete db-init
echo "Database initialization completed"
