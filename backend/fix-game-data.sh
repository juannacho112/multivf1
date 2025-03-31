#!/bin/bash

# Script to run the VeefriendsGame data integrity test

echo "Running VeeFriends Game data integrity test & repair tool..."

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

# Run the data integrity test script
node --experimental-modules test-vfgame-data.js

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "Data integrity test & repair completed successfully!"
else
    echo "Data integrity test & repair encountered errors. Check the logs above."
    exit 1
fi

echo "VeeFriends Game data repair process finished."
