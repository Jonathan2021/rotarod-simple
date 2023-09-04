#!/bin/sh

# Don't call directly (or pass NODE_ENV if you do). Is used in ecosystem.config.js with pm2
exec ./node_modules/.bin/ts-node -T server.ts
