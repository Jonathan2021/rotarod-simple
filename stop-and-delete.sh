#!/bin/bash

# Stop the app
pm2 stop rotarod-server

# Delete the app
pm2 delete rotarod-server

echo "Apps stopped and deleted."
