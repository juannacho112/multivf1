#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VeeFriends Card Game Development Launcher ===${NC}"
echo -e "${YELLOW}Starting development servers...${NC}"

# Function to handle cleanup on exit
cleanup() {
  echo -e "${YELLOW}\nShutting down development servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Register the cleanup function for when script exits
trap cleanup SIGINT SIGTERM

# Start Backend Server
echo -e "${GREEN}Starting backend server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}Backend server started with PID: $BACKEND_PID${NC}"

# Wait a bit for backend to initialize
sleep 2

# Start Frontend
echo -e "${GREEN}Starting frontend application...${NC}"
npm run start &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend application started with PID: $FRONTEND_PID${NC}"

echo -e "${BLUE}\nDevelopment servers running:${NC}"
echo -e " - ${YELLOW}Backend:${NC} http://localhost:3000"
echo -e " - ${YELLOW}Frontend:${NC} Metro bundler \n"
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"

# Wait for user to cancel with Ctrl+C
wait
