#!/bin/bash
# Cleanup script for VeeFriends multiplayer database
# Fixes issues with deck formatting and game state

# Set error handling
set -e

echo "=== VeeFriends Database Cleanup Tool ==="
echo "This script will fix database issues with deck formatting"
echo "and game state consistency problems."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to the backend directory
cd "$(dirname "$0")"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Make sure you're running this from the backend directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. You need a .env file with MONGODB_URI defined."
    exit 1
fi

echo "Installing dependencies if needed..."
npm install dotenv mongoose

echo "Starting database cleanup..."
node cleanup-db.js

echo ""
echo "Cleanup process completed!"
echo "Check the output above for details on fixed games."
