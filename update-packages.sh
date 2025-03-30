#!/bin/bash

# VeeFriends Card Game - Package Update and Compatibility Script
# Run with: ./update-packages.sh

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== VeeFriends Card Game Package Update Script ===${NC}"
echo -e "${YELLOW}This script will update and fix package dependencies for compatibility${NC}"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Function to update backend packages
update_backend_packages() {
    echo -e "${BLUE}Updating backend packages...${NC}"
    
    # Navigate to backend directory
    cd backend
    
    # Create package backup
    cp package.json package.json.bak
    echo -e "${YELLOW}Backed up package.json to package.json.bak${NC}"
    
    # Install core backend dependencies
    echo -e "${GREEN}Installing backend core dependencies...${NC}"
    npm install --save express mongoose cors socket.io jsonwebtoken bcryptjs dotenv uuid
    
    # Install development dependencies
    echo -e "${GREEN}Installing backend development dependencies...${NC}"
    npm install --save-dev nodemon
    
    # Fix potential socket.io compatibility issues
    echo -e "${YELLOW}Ensuring Socket.IO compatible versions...${NC}"
    npm install --save socket.io@4.7.2
    npm install --save-dev @types/socket.io@3.0.2
    
    # Check for dependency issues
    echo -e "${BLUE}Checking for dependency issues...${NC}"
    npm audit fix
    
    cd ..
    
    echo -e "${GREEN}Backend packages updated successfully.${NC}"
    echo
}

# Function to update frontend packages
update_frontend_packages() {
    echo -e "${BLUE}Updating frontend packages...${NC}"
    
    # Create package backup
    cp package.json package.json.bak
    echo -e "${YELLOW}Backed up package.json to package.json.bak${NC}"
    
    # Install core frontend dependencies
    echo -e "${GREEN}Installing frontend core dependencies...${NC}"
    npm install --save expo @react-navigation/native @react-navigation/stack expo-constants expo-linking expo-router expo-web-browser expo-status-bar react-native socket.io-client @react-native-async-storage/async-storage
    
    # Install specific versions known to be compatible
    echo -e "${YELLOW}Installing specific compatible versions...${NC}"
    npm install --save socket.io-client@4.7.2  # Match backend socket.io version
    npm install --save @react-native-async-storage/async-storage@1.18.2  # Ensure compatible with Expo
    
    # Add missing type definitions
    echo -e "${GREEN}Installing type definitions...${NC}"
    npm install --save-dev @types/react @types/react-native
    
    # Check for dependency issues
    echo -e "${BLUE}Checking for dependency issues...${NC}"
    npm audit fix
    
    echo -e "${GREEN}Frontend packages updated successfully.${NC}"
    echo
}

# Main execution
echo -e "${BLUE}Starting package updates...${NC}"

# First check if we have both frontend and backend structure
if [ -d "backend" ]; then
    echo -e "${GREEN}Found backend directory.${NC}"
    
    # Update backend packages
    update_backend_packages
else
    echo -e "${RED}Backend directory not found. Skipping backend package updates.${NC}"
fi

# Check for frontend structure (main package.json in root)
if [ -f "package.json" ]; then
    echo -e "${GREEN}Found frontend package.json.${NC}"
    
    # Update frontend packages
    update_frontend_packages
else
    echo -e "${RED}Frontend package.json not found. Skipping frontend package updates.${NC}"
fi

# Make scripts executable
echo -e "${BLUE}Making startup scripts executable...${NC}"
chmod +x start-dev.sh start-production.sh update-packages.sh

echo -e "${BLUE}=== Package update complete ===${NC}"
echo -e "${GREEN}All dependencies have been updated to compatible versions.${NC}"
echo -e "${YELLOW}You can now run the development server using: ./start-dev.sh${NC}"
echo -e "${YELLOW}Or run in production mode using: ./start-production.sh${NC}"
