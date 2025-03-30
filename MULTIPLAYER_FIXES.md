# VeeFriends Card Game Multiplayer Fixes

This document outlines the fixes and improvements made to resolve the multiplayer functionality issues in the VeeFriends card game application.

## Issues Fixed

### 1. Socket.IO Connection Issues

- **Problem:** Users encountered "xhr poll error" and connection failures during login/guest login
- **Fixes:**
  - Updated Socket.IO configuration to use both `'polling'` and `'websocket'` transports simultaneously instead of upgrading
  - Improved CORS configuration to properly handle connections from both web and mobile clients
  - Enhanced Socket.IO error handling with better logging and connection retry mechanisms
  - Fixed connection timeout settings for more reliable connections

### 2. WebSocket Authentication

- **Problem:** WebSocket connections lacked proper authentication and security
- **Fixes:**
  - Implemented robust authentication middleware that verifies JWT tokens before establishing connections
  - Added token extraction from multiple sources (auth object, headers, query params) for better compatibility
  - Created fallback authentication mechanisms for database connectivity issues
  - Added detailed error logging for authentication failures

### 3. Game Logic Consistency

- **Problem:** Multiplayer game logic was inconsistent with single-player rules
- **Fixes:**
  - Ensured multiplayer game logic follows the same rules and flow as the single-player mode
  - Fixed type conversion issues between frontend and backend card models
  - Added better error handling in game action processing

### 4. UI Improvements

- **Problem:** Multiplayer UI was different from single-player, creating inconsistent experience
- **Fixes:**
  - Updated the OnlineBattleScreen to use the same UI components as the single-player game
  - Fixed GameWaitingRoom to display correct VeeFriends game rules
  - Improved game state handling for more consistent UI updates

## New Features

### 1. Development and Production Scripts

- **`start-dev.sh`**: Launches both backend and frontend development servers
- **`start-production.sh`**: Sets up and runs the application in production mode with PM2
- **`update-packages.sh`**: Helps maintain dependencies with automatic backup and update

### 2. Improved Error Handling and Logging

- Added more comprehensive error logging throughout the application
- Improved error handling for network issues, authentication failures, and game state errors
- Better user feedback for connection issues and authentication problems

## Usage Instructions

### Development Mode

To run the application in development mode:

```bash
./start-dev.sh
```

This will:
1. Start the backend Node.js server at port 3000
2. Create .env file if needed
3. Launch the Expo development server for the frontend

### Production Mode

To deploy the application in production:

```bash
./start-production.sh
```

This will:
1. Install PM2 if not already installed
2. Build the backend
3. Start the backend using PM2
4. Launch Expo in production mode

To stop the production server:

```bash
pm2 stop veefriends-backend
pm2 delete veefriends-backend
```

### Updating Dependencies

To update project dependencies:

```bash
./update-packages.sh
```

This will:
1. Create backups of package.json and package-lock.json
2. Update dependencies for both root project and backend
3. Provide instructions for reverting if needed

## Known Limitations

- Guest users need to be cleaned up periodically (automatic cleanup not implemented)
- Error handling in multiplayer does not yet support all edge cases
- Socket reconnection logic could be further improved for very unstable connections

## Technical Details

### Server Configuration

- The server is configured to run at the domain `vf.studioboost.pro` 
- Both HTTP and HTTPS connections are supported, with HTTP preferred for websockets
- CORS is configured to accept connections from allowed origins with credentials

### Authentication Flow

1. Client attempts connection with token or guest flag
2. Server middleware authenticates token or creates guest session
3. On successful auth, client receives socket events and can join/create games

### Game State Synchronization

Game state is synchronized through socket events:
- `game:stateUpdate` - Broadcasts game state changes to all players
- `game:actionResult` - Sends results of game actions to players
- `game:ended` - Notifies players when game is complete

## Next Steps

- Implement periodic cleanup of guest users
- Add more comprehensive error handling for edge cases
- Consider implementing reconnection logic for dropped connections during active games
