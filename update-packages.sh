#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  VeeFriends Dependencies Update  ${NC}"
echo -e "${BLUE}==================================${NC}\n"

# Function to update packages in a directory
update_packages() {
  local dir=$1
  local type=$2
  
  echo -e "${YELLOW}Checking ${type} dependencies...${NC}"
  cd "${dir}" || { echo -e "${RED}Could not navigate to ${dir}${NC}"; return; }
  
  # Check for outdated packages
  echo -e "${BLUE}Currently outdated packages:${NC}"
  npm outdated
  
  # Backup package.json and package-lock.json
  echo -e "${YELLOW}Backing up package files...${NC}"
  cp package.json package.json.bak
  if [ -f package-lock.json ]; then
    cp package-lock.json package-lock.json.bak
  fi
  
  # Update dependencies
  echo -e "${GREEN}Updating ${type} dependencies...${NC}"
  npm update
  
  # Update dev dependencies if in root or backend
  if [ "${type}" != "frontend" ]; then
    echo -e "${GREEN}Updating ${type} dev dependencies...${NC}"
    npm update --dev
  fi
  
  echo -e "${GREEN}${type^} dependencies updated successfully!${NC}\n"
  cd - > /dev/null
}

# Main project directory
PROJECT_DIR=$(pwd)

# Update root project dependencies
update_packages "${PROJECT_DIR}" "root"

# Update backend dependencies
BACKEND_DIR="${PROJECT_DIR}/backend"
if [ -d "${BACKEND_DIR}" ]; then
  update_packages "${BACKEND_DIR}" "backend"
else
  echo -e "${RED}Backend directory not found!${NC}"
fi

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}    Package Updates Complete      ${NC}"
echo -e "${BLUE}==================================${NC}\n"

echo -e "${YELLOW}Important Notes:${NC}"
echo -e "1. Test the application thoroughly after updates"
echo -e "2. If you encounter issues, restore from backups:"
echo -e "   ${GREEN}cp package.json.bak package.json${NC}"
echo -e "   ${GREEN}cp package-lock.json.bak package-lock.json${NC}"
echo -e "   ${GREEN}npm ci${NC}"
echo -e "3. Socket.IO version changes may require code updates\n"

echo -e "${GREEN}Package backups are located in each directory.${NC}"
