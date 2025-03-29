#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}VeeFriends Card Game - Package Update Script${NC}"
echo -e "${YELLOW}----------------------------------------------${NC}"

# Check Node.js and NPM
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed. Please install it before continuing.${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}Error: NPM is not installed. Please install it before continuing.${NC}"
  exit 1
fi

# Display current Node.js and NPM versions
echo -e "${GREEN}Node.js version: $(node -v)${NC}"
echo -e "${GREEN}NPM version: $(npm -v)${NC}"
echo -e "${YELLOW}----------------------------------------------${NC}"

# Function to update packages
update_packages() {
  echo -e "${BLUE}Updating packages to compatible versions...${NC}"
  
  # Define expected versions for compatibility with Expo
  echo -e "${YELLOW}Installing compatible package versions...${NC}"
  
  npm install @react-native-async-storage/async-storage@1.23.1 \
              expo@~52.0.41 \
              expo-constants@~17.0.8 \
              expo-router@~4.0.19 \
              jest-expo@~52.0.6 \
              --legacy-peer-deps
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to update packages. Try running with --force flag:${NC}"
    echo -e "${YELLOW}npm install @react-native-async-storage/async-storage@1.23.1 expo@~52.0.41 expo-constants@~17.0.8 expo-router@~4.0.19 jest-expo@~52.0.6 --force${NC}"
    return 1
  fi
  
  echo -e "${GREEN}Packages updated successfully.${NC}"
  return 0
}

# Function to install backend dependencies
install_backend_deps() {
  echo -e "${BLUE}Checking backend dependencies...${NC}"
  
  if [ ! -d "backend" ]; then
    echo -e "${RED}Backend directory not found.${NC}"
    return 1
  fi
  
  cd backend
  
  echo -e "${YELLOW}Installing backend dependencies...${NC}"
  npm install
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies.${NC}"
    cd ..
    return 1
  fi
  
  echo -e "${GREEN}Backend dependencies installed successfully.${NC}"
  cd ..
  return 0
}

# Main script execution
echo -e "${BLUE}Updating frontend packages...${NC}"
update_packages

echo -e "${YELLOW}----------------------------------------------${NC}"

echo -e "${BLUE}Installing backend dependencies...${NC}"
install_backend_deps

echo -e "${YELLOW}----------------------------------------------${NC}"

echo -e "${GREEN}Package update completed.${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. ${YELLOW}Run './start-production.sh' to start the production server${NC}"
echo -e "2. ${YELLOW}Run './start-dev.sh' to start the development environment${NC}"
echo -e "${YELLOW}----------------------------------------------${NC}"
