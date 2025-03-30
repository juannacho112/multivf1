#!/bin/bash

# Development startup script for VeeFriends Card Game Server
# Run with: ./start-dev.sh

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VeeFriends Card Game Development Server ===${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check for .env file in backend directory
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}No .env file found in backend directory. Creating from example...${NC}"
    
    if [ -f backend/.Examplenv ]; then
        cp backend/.Examplenv backend/.env
        echo -e "${GREEN}Created .env file from example.${NC}"
    else
        echo -e "${YELLOW}No .Examplenv file found. Creating a basic .env file...${NC}"
        echo "PORT=3000" > backend/.env
        echo "MONGODB_URI=mongodb://localhost:27017/veefriends" >> backend/.env
        echo "JWT_SECRET=dev-jwt-secret-replace-in-production" >> backend/.env
        echo -e "${GREEN}Created basic .env file.${NC}"
    fi
    
    echo -e "${YELLOW}You may want to check and update settings in backend/.env${NC}"
fi

# Install backend dependencies if needed
echo -e "${BLUE}Checking backend dependencies...${NC}"
if [ ! -d backend/node_modules ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install
    cd ..
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install backend dependencies.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Backend dependencies installed.${NC}"
else
    echo -e "${GREEN}Backend dependencies already installed.${NC}"
fi

# Check if nodemon is installed
NODEMON_AVAILABLE=false
if command -v nodemon &> /dev/null || [ -f "backend/node_modules/.bin/nodemon" ]; then
    NODEMON_AVAILABLE=true
    echo -e "${GREEN}nodemon is available for automatic server restart.${NC}"
else
    echo -e "${YELLOW}nodemon is not installed. Using node directly (no auto-restart).${NC}"
    echo -e "${YELLOW}You can install nodemon with: npm install --save-dev nodemon${NC}"
fi

# Start MongoDB if it's installed locally and not running
if command -v mongod &> /dev/null; then
    echo -e "${BLUE}Checking MongoDB status...${NC}"
    
    # Try to connect to MongoDB
    mongosh --eval "db.version()" --quiet &> /dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}MongoDB not running. Starting MongoDB...${NC}"
        
        # Create data directory if it doesn't exist
        mkdir -p ~/data/db
        
        # Start MongoDB in the background
        mongod --dbpath ~/data/db > logs/mongodb.log 2>&1 &
        
        # Wait for MongoDB to start
        sleep 3
        
        # Check if MongoDB started successfully
        mongosh --eval "db.version()" --quiet &> /dev/null
        if [ $? -ne 0 ]; then
            echo -e "${YELLOW}Warning: Could not start MongoDB. Please make sure MongoDB is installed and running.${NC}"
            echo -e "${YELLOW}The server will start, but database functionality will be limited.${NC}"
        else
            echo -e "${GREEN}MongoDB started successfully.${NC}"
        fi
    else
        echo -e "${GREEN}MongoDB is already running.${NC}"
    fi
else
    echo -e "${YELLOW}MongoDB not detected locally. Make sure MongoDB is running remotely or installed.${NC}"
    echo -e "${YELLOW}Check backend/.env for the correct MONGODB_URI setting.${NC}"
fi

# Start the backend server
echo -e "${BLUE}Starting VeeFriends Card Game Server...${NC}"

if [ "$NODEMON_AVAILABLE" = true ]; then
    if [ -f backend/node_modules/.bin/nodemon ]; then
        echo -e "${GREEN}Starting server with local nodemon...${NC}"
        cd backend && ./node_modules/.bin/nodemon src/server.js
    else
        echo -e "${GREEN}Starting server with global nodemon...${NC}"
        cd backend && nodemon src/server.js
    fi
else
    echo -e "${GREEN}Starting server with node...${NC}"
    cd backend && node src/server.js
fi

# This part will only execute if the server stops
echo -e "${RED}Server stopped.${NC}"
