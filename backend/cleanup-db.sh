#!/bin/bash

# VeeFriends Multiplayer - Database Cleanup Script

# Display terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}VeeFriends Multiplayer - Database Cleanup${NC}"
echo "========================================"
echo "This script will fix any corrupted deck data in your VeeFriends database."
echo -e "${RED}IMPORTANT: Make sure your server is not running before proceeding.${NC}"
echo ""

# Change to the script directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: No .env file found.${NC}"
    echo "Creating a new one. You'll need to provide your MongoDB connection string."
    
    # Prompt user for MongoDB URI
    read -p "Enter MongoDB URI (or leave blank to use default): " mongodb_uri
    
    if [ -z "$mongodb_uri" ]; then
        mongodb_uri="mongodb://localhost:27017/veefriends-game"
        echo "Using default URI: $mongodb_uri"
    fi
    
    # Create .env file
    echo "MONGODB_URI=$mongodb_uri" > .env
    echo -e "${GREEN}.env file created successfully!${NC}"
fi

echo ""
echo "Starting database cleanup..."
echo ""
NODE_OPTIONS=--experimental-modules node cleanup-db.js

echo ""
echo -e "${GREEN}Database cleanup complete!${NC}"
echo ""
echo "You can now restart your server."
