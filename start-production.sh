#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting VeeFriends Card Game Production Server${NC}"
echo -e "${YELLOW}----------------------------------------------${NC}"

# Check for required commands
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}Error: $1 is not installed. Please install it before continuing.${NC}"
    return 1
  fi
  return 0
}

# Check for Node.js
if ! check_command node; then
  echo -e "${RED}Please install Node.js from https://nodejs.org/${NC}"
  exit 1
fi

# Check for NPM
if ! check_command npm; then
  echo -e "${RED}NPM is required but not found. It typically comes with Node.js installation.${NC}"
  exit 1
fi

# Install backend dependencies if needed
echo -e "${BLUE}Checking backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo -e "${YELLOW}Installing backend dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Backend dependencies installed successfully.${NC}"
else
  echo -e "${GREEN}Backend dependencies already installed.${NC}"
fi

# Check MongoDB
echo -e "${BLUE}Checking MongoDB status...${NC}"
if command -v mongod &> /dev/null; then
  if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}MongoDB is already running.${NC}"
  else
    echo -e "${YELLOW}Starting MongoDB...${NC}"
    if [ -x "$(command -v systemctl)" ]; then
      systemctl start mongod || echo -e "${RED}Failed to start MongoDB with systemctl. Try running: sudo systemctl start mongod${NC}"
    else
      echo -e "${YELLOW}Starting MongoDB manually...${NC}"
      mongod --fork --logpath /tmp/mongod.log || echo -e "${RED}Failed to start MongoDB manually. You may need to start it yourself.${NC}"
    fi
  fi
else
  echo -e "${YELLOW}MongoDB command not found. Please ensure MongoDB is installed and running.${NC}"
  echo -e "${YELLOW}Visit https://www.mongodb.com/docs/manual/installation/ for installation instructions.${NC}"
fi

# Start backend server
echo -e "${BLUE}Starting backend server...${NC}"
echo -e "${GREEN}Backend will run on port 3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when done${NC}"

# Start backend in the background with log output
node src/server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend server started with PID: ${BACKEND_PID}${NC}"
sleep 3

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
  echo -e "${GREEN}Backend server is running.${NC}"
else
  echo -e "${RED}Backend server failed to start. Check backend.log for details.${NC}"
  echo -e "${RED}Latest log output:${NC}"
  tail -n 10 ../backend.log
  exit 1
fi

# Return to the root directory
cd ..

# Server information
echo -e "${BLUE}----------------------------------------------${NC}"
echo -e "${GREEN}Server Information:${NC}"
echo -e "${YELLOW}Backend API: http://localhost:3000/api${NC}"
echo -e "${YELLOW}Socket.IO: http://localhost:3000${NC}"
echo -e "${YELLOW}Health Check: http://localhost:3000/health${NC}"
echo -e "${YELLOW}API Documentation: http://localhost:3000/info${NC}"
echo -e "${BLUE}----------------------------------------------${NC}"

# Log file information
echo -e "${YELLOW}Server logs are being written to: backend.log${NC}"
echo -e "${YELLOW}To view live logs, run: tail -f backend.log${NC}"

# Provide instructions for stopping
echo -e "${BLUE}----------------------------------------------${NC}"
echo -e "${GREEN}To stop the server later, run:${NC}"
echo -e "${YELLOW}kill ${BACKEND_PID}${NC}"
echo -e "${BLUE}----------------------------------------------${NC}"

# Save PID to file for later reference
echo $BACKEND_PID > backend.pid
echo -e "${GREEN}Server is running! PID saved to backend.pid${NC}"
