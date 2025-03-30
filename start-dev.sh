#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  VeeFriends Game Dev Starter     ${NC}"
echo -e "${BLUE}==================================${NC}\n"

# Start backend server in a new terminal
echo -e "${GREEN}Starting backend server...${NC}"
cd backend || { echo -e "${RED}Error: 'backend' directory not found!${NC}"; exit 1; }

if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Warning: No .env file found in backend directory. Creating from .Examplenv${NC}"
  if [ -f ".Examplenv" ]; then
    cp .Examplenv .env
    echo -e "${GREEN}Created .env file from .Examplenv${NC}"
  else
    echo -e "${RED}Error: Could not find .Examplenv file!${NC}"
    touch .env
    echo "JWT_SECRET=veefriends_jwt_secret_default" >> .env
    echo "MONGODB_URI=mongodb://localhost:27017/veefriends" >> .env
    echo "PORT=3000" >> .env
    echo -e "${YELLOW}Created basic .env file with default values${NC}"
  fi
fi

# Start backend in a background process
echo -e "${GREEN}Starting Backend: Node.js server at port 3000...${NC}"
(cd backend && npm run dev) &
BACKEND_PID=$!

# Wait for backend to start (give it 5 seconds)
echo -e "${YELLOW}Waiting for backend to initialize (5 seconds)...${NC}"
sleep 5

# Start frontend in a new terminal
echo -e "\n${GREEN}Starting frontend...${NC}"
echo -e "${BLUE}Starting React Native development server for frontend...${NC}"

# Run the frontend 
echo -e "${GREEN}Starting Expo development server...${NC}"
npm start

# If we get here, the frontend has been closed
echo -e "\n${YELLOW}Frontend process ended. Cleaning up...${NC}"

# Cleanup: Kill the backend process if it's still running
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}Shutting down backend server...${NC}"
  kill $BACKEND_PID
fi

echo -e "\n${BLUE}==================================${NC}"
echo -e "${BLUE}  Development servers stopped      ${NC}"
echo -e "${BLUE}==================================${NC}"
