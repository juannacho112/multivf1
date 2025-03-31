#!/bin/bash
# Script to run the database cleanup utility

# Go to script directory
cd "$(dirname "$0")"

echo "Running VeeFriends deck data cleanup utility..."

# Run using Node.js with ESM support
node cleanup-db.js

echo "Cleanup completed."
