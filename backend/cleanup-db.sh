#!/bin/bash

# Helper script to run the database cleanup utility

echo "Running VeeFriends deck data cleanup utility..."

# Navigate to the project directory if needed
cd "$(dirname "$0")"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed"
    exit 1
fi

# Make sure we have the dependencies installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the cleanup script
node --experimental-modules src/utils/cleanupDeckData.js

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "Cleanup completed successfully!"
else
    echo "Cleanup encountered errors. Check the logs above."
    exit 1
fi

echo "Database cleanup process finished."
