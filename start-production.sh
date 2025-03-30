#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  VeeFriends Game Production Mode ${NC}"
echo -e "${BLUE}==================================${NC}\n"

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing PM2 globally...${NC}"
    npm install -g pm2
fi

# Check if backend .env file exists
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
    echo "NODE_ENV=production" >> .env
    echo -e "${YELLOW}Created basic .env file with production values${NC}"
  fi
fi

# Install dependencies if needed
echo -e "${GREEN}Checking backend dependencies...${NC}"
npm ci --production

cd ../

# Install frontend dependencies if needed
echo -e "${GREEN}Checking frontend dependencies...${NC}"
npm ci --production

# Build backend
echo -e "${GREEN}Building backend...${NC}"
cd backend && npm run build

# Start backend with PM2
echo -e "${GREEN}Starting backend with PM2...${NC}"
pm2 start dist/server.js --name veefriends-backend

# Return to root directory
cd ..

# Check if the Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo -e "${YELLOW}Expo CLI not found. Installing Expo CLI...${NC}"
    npm install -g expo-cli
fi

# Start Expo in production mode
echo -e "${GREEN}Starting Expo in production mode...${NC}"
expo start --no-dev --minify

echo -e "\n${BLUE}==================================${NC}"
echo -e "${BLUE}  Production server started        ${NC}"
echo -e "${BLUE}==================================${NC}\n"

echo -e "${YELLOW}To stop the backend server:${NC}"
echo -e "${GREEN}pm2 stop veefriends-backend${NC}"
echo -e "${GREEN}pm2 delete veefriends-backend${NC}\n"

echo -e "${YELLOW}Backend logs can be viewed with:${NC}"
echo -e "${GREEN}pm2 logs veefriends-backend${NC}"
