#!/bin/bash

# Script to run the VeeFriends database cleanup utility

# Display terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}VeeFriends Database Cleanup Utility${NC}"
echo "-------------------------------------"
echo "This script will fix corrupted deck data in the MongoDB database."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Change to the script directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: No .env file found. Make sure your MONGODB_URI environment variable is set."
    
    # Prompt user for MongoDB URI
    read -p "Enter MongoDB URI (or leave blank to cancel): " mongodb_uri
    
    if [ -z "$mongodb_uri" ]; then
        echo "Operation cancelled."
        exit 0
    fi
    
    # Create temporary .env file
    echo "MONGODB_URI=$mongodb_uri" > .env.temp
    
    echo "Running cleanup script..."
    NODE_OPTIONS=--experimental-modules node cleanup-db.js
    
    # Remove temporary .env file
    rm .env.temp
else
    echo "Running cleanup script..."
    NODE_OPTIONS=--experimental-modules node cleanup-db.js
fi

echo ""
echo -e "${GREEN}Operation complete.${NC}"
echo "Check the output above for details on what was fixed."
