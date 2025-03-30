#!/bin/bash

# Production startup script for VeeFriends Card Game Server
# Works on Ubuntu and other Linux systems
# Run with: ./start-production.sh

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VeeFriends Card Game Server Production Startup ===${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR" -lt "14" ]; then
    echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected. We recommend Node.js 14 or higher.${NC}"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 is not installed. Installing PM2 globally...${NC}"
    npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install PM2. Please install it manually: npm install -g pm2${NC}"
        echo -e "${YELLOW}Continuing with normal node startup instead...${NC}"
        USE_PM2=false
    else
        echo -e "${GREEN}PM2 installed successfully.${NC}"
        USE_PM2=true
    fi
else
    echo -e "${GREEN}PM2 is installed.${NC}"
    USE_PM2=true
fi

# Check for .env file in backend directory
if [ ! -f backend/.env ]; then
    echo -e "${YELLOW}No .env file found in backend directory. Creating from example...${NC}"
    
    if [ -f backend/.Examplenv ]; then
        cp backend/.Examplenv backend/.env
        echo -e "${GREEN}Created .env file from example.${NC}"
        echo -e "${YELLOW}Please check and update the settings in backend/.env${NC}"
    else
        echo -e "${RED}No .Examplenv file found. Creating a basic .env file...${NC}"
        echo "PORT=3000" > backend/.env
        echo "MONGODB_URI=mongodb://localhost:27017/veefriends" >> backend/.env
        echo "JWT_SECRET=dev-jwt-secret-replace-in-production" >> backend/.env
        echo -e "${YELLOW}Created basic .env file. Please update the settings in backend/.env${NC}"
    fi
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
            echo -e "${YELLOW}The server will start, but database functionality may be limited.${NC}"
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

echo -e "${BLUE}Starting VeeFriends Card Game Server...${NC}"

# Start the backend server using PM2 if available
if [ "$USE_PM2" = true ]; then
    # Check if the server is already running in PM2
    pm2 list | grep "veefriendsserver" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}Server is already running. Restarting...${NC}"
        pm2 restart veefriendsserver
    else
        echo -e "${GREEN}Starting server with PM2...${NC}"
        cd backend && pm2 start src/server.js --name "veefriendsserver" --time
    fi
    
    echo -e "${GREEN}Server started with PM2. Logs available with: pm2 logs veefriendsserver${NC}"
    pm2 status
else
    # Start with Node.js directly as fallback
    echo -e "${GREEN}Starting server with Node.js...${NC}"
    cd backend && node src/server.js > ../logs/server.log 2>&1 &
    SERVER_PID=$!
    echo -e "${GREEN}Server started with PID: $SERVER_PID${NC}"
    echo -e "${YELLOW}Logs available at: logs/server.log${NC}"
fi

echo -e "${BLUE}=== Server startup complete ===${NC}"
echo -e "${GREEN}VeeFriends Card Game Server is running on port 3000${NC}"
echo -e "${YELLOW}API Documentation: http://<server-ip>:3000/info${NC}"
echo -e "${YELLOW}Health Check: http://<server-ip>:3000/health${NC}"
