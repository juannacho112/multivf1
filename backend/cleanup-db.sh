#!/bin/bash

# Script to run the deck data cleanup utility
echo "Starting VeeFriends deck data cleanup..."
echo "This script will cleanup any string deck data in the MongoDB database"
echo ""

# Change to the backend directory if executed from elsewhere
cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Run the cleanup utility
echo "Running cleanup script..."
node --experimental-modules src/utils/cleanupDeckData.js

# Check the exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Cleanup completed successfully"
    echo "Any games with string deck data have been fixed"
else
    echo ""
    echo "❌ Cleanup failed"
    echo "Please check the error messages above"
fi

echo ""
echo "You can now start the server normally"
