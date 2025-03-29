#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting VeeFriends Card Game Development Server${NC}"
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

# Check if MongoDB is running
echo -e "${BLUE}Checking if MongoDB is running...${NC}"
if command -v mongod &> /dev/null; then
  if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}MongoDB is already running.${NC}"
  else
    echo -e "${YELLOW}MongoDB is not running. Starting MongoDB...${NC}"
    if [ -x "$(command -v systemctl)" ]; then
      echo -e "${YELLOW}Attempting to start MongoDB with systemctl...${NC}"
      systemctl start mongod || sudo systemctl start mongod || echo -e "${RED}Failed to start MongoDB with systemctl${NC}"
    else
      echo -e "${YELLOW}Attempting to start MongoDB manually...${NC}"
      mongod --fork --logpath /tmp/mongod.log || echo -e "${RED}Failed to start MongoDB manually${NC}"
    fi
  fi
else
  echo -e "${YELLOW}MongoDB command not found. You may need to start it manually.${NC}"
  echo -e "${YELLOW}Visit https://www.mongodb.com/docs/manual/installation/ for installation instructions.${NC}"
fi

# Start the backend server
echo -e "${BLUE}Starting backend server...${NC}"

# Check if nodemon is available in node_modules
if [ -f "node_modules/.bin/nodemon" ]; then
  echo -e "${GREEN}Using locally installed nodemon...${NC}"
  
  # Try to open in a new terminal if available
  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd) && npm run dev; read -p 'Press enter to close...'"
  elif command -v xterm &> /dev/null; then
    xterm -e "cd $(pwd) && npm run dev; read -p 'Press enter to close...'" &
  else
    # Fall back to running in background if no terminal available
    echo -e "${YELLOW}Starting backend with nodemon in background...${NC}"
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}Backend server started with nodemon, PID: ${BACKEND_PID}${NC}"
    echo -e "${YELLOW}Logs available in backend.log${NC}"
  fi
else
  # If nodemon is not available, use regular node
  echo -e "${YELLOW}Nodemon not found. Starting backend with node...${NC}"
  node src/server.js > ../backend.log 2>&1 &
  BACKEND_PID=$!
  echo -e "${GREEN}Backend server started with node, PID: ${BACKEND_PID}${NC}"
  echo -e "${YELLOW}Logs available in backend.log${NC}"
fi

# Save PID for later cleanup
if [ -n "$BACKEND_PID" ]; then
  echo $BACKEND_PID > ../backend.pid
fi

# Go back to root directory
cd ..

# Start the frontend server
echo -e "${BLUE}Starting frontend app...${NC}"
echo -e "${YELLOW}Note: The frontend will open automatically in your browser.${NC}"
echo -e "${YELLOW}Socket.IO is configured to connect to: http://localhost:3000${NC}"
echo -e "${GREEN}----------------------------------------------${NC}"

# In production, use:
# SOCKET_URL=https://vf.studioboost.pro npm start
npm start

# If we started the backend in background, kill it when this script exits
if [ -n "$BACKEND_PID" ]; then
  echo -e "${BLUE}Stopping backend server...${NC}"
  kill $BACKEND_PID
  echo -e "${GREEN}Backend server stopped.${NC}"
fi

echo -e "${GREEN}Development environment shutdown complete.${NC}"
