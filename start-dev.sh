#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting VeeFriends Card Game Development Server${NC}"
echo -e "${YELLOW}----------------------------------------------${NC}"

# Check if MongoDB is running
echo -e "${BLUE}Checking if MongoDB is running...${NC}"
if command -v mongod &> /dev/null; then
  if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}MongoDB is already running.${NC}"
  else
    echo -e "${YELLOW}MongoDB is not running. Starting MongoDB...${NC}"
    if [ -x "$(command -v systemctl)" ]; then
      sudo systemctl start mongodb || echo -e "${RED}Failed to start MongoDB with systemctl${NC}"
    else
      mongod --fork --logpath /tmp/mongod.log || echo -e "${RED}Failed to start MongoDB manually${NC}"
    fi
  fi
else
  echo -e "${YELLOW}MongoDB command not found. You may need to start it manually.${NC}"
fi

# Start the backend server in a new terminal
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
if command -v gnome-terminal &> /dev/null; then
  gnome-terminal -- bash -c "npm run dev; read -p 'Press enter to close...'"
elif command -v xterm &> /dev/null; then
  xterm -e "npm run dev; read -p 'Press enter to close...'" &
else
  echo -e "${YELLOW}Starting backend in background...${NC}"
  npm run dev &
  BACKEND_PID=$!
  echo -e "${GREEN}Backend server started with PID: ${BACKEND_PID}${NC}"
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
