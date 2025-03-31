#!/bin/bash

# VeeFriends Multiplayer - Database Initialization Script

# Display terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}VeeFriends Multiplayer - Database Setup${NC}"
echo "========================================"
echo "This script will initialize the VeeFriends game database"
echo "and create all necessary collections."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

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
echo "Initializing database..."
NODE_OPTIONS=--experimental-modules node init-veefriends-db.js

echo ""
echo -e "${GREEN}Database initialization complete!${NC}"
echo ""
echo "You can now start the server with 'npm start' in the backend directory."
echo "The VeeFriends multiplayer game should now be working properly."
