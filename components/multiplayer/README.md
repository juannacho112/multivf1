# Multiplayer Component

This module handles all the online multiplayer functionality for the VeeFriends Card Game, including authentication, real-time game state synchronization, and networking.

## Architecture

The multiplayer system is built on a client-server architecture using Socket.IO for real-time communication:

```
┌────────────┐      WebSocket/HTTP      ┌────────────┐
│            │<───────────────────────> │            │
│  Frontend  │                          │  Backend   │
│ (React     │  Real-time game events   │ (Node.js   │
│  Native)   │<───────────────────────> │  Socket.IO)│
│            │                          │            │
└────────────┘                          └────────────┘
        │                                      │
        │                                      │
        │             ┌────────────┐           │
        └────────────>│            │<──────────┘
                      │  MongoDB   │
                      │            │
                      └────────────┘
```

## Key Components

### Frontend

1. **MultiplayerContext.tsx**
   - Provides a React Context for multiplayer state management
   - Handles authentication state, game state, and socket events
   - Exposes methods for interacting with the server

2. **SocketService.ts**
   - Manages the Socket.IO connection
   - Handles connection reliability and automatic reconnection
   - Abstracts socket event management

3. **AuthScreen.tsx**
   - Handles user authentication (register, login, or guest access)
   - Initiates socket connections

4. **MultiplayerLobbyScreen.tsx**
   - Shows online users and game creation options
   - Manages game invites and matchmaking

5. **GameWaitingRoom.tsx**
   - Allows players to prepare before starting a game
   - Shows game code for sharing and inviting friends

6. **OnlineBattleScreen.tsx**
   - Main interface for the online card battle
   - Renders game state and handles player actions

### Backend

1. **veefriendsSocketService.js**
   - Handles all Socket.IO events
   - Manages client connections and user state
   - Processes game actions and synchronizes game state

2. **VeefriendsGame.js**
   - MongoDB model for game state
   - Contains game logic and state management

3. **authController.js**
   - Handles user authentication and registration
   - Generates JWT tokens for secure authentication

## Configuration

### Socket Connection

The multiplayer component is designed to work with various network setups. It will attempt to connect to multiple server URLs until a successful connection is established:

```typescript
// From SocketService.ts
const SERVER_URLS = [
  'http://localhost:3000',     // Local development
  'http://127.0.0.1:3000',     // Alternative localhost
  'http://10.0.2.2:3000',      // For Android emulator
  'http://192.168.126.128:3000', // Example VM IP
  'http://0.0.0.0:3000'        // All interfaces
];
```

For production deployment, make sure to:

1. Add your production URL to the SERVER_URLS array:
   ```typescript
   'https://veefriends.studioboost.pro', // Production URL
   ```

2. Ensure your backend's CORS settings allow connections from your frontend's origin.

### Authentication

The system supports three types of authentication:

1. **Guest mode**: No account needed, users connect with temporary IDs
   - Perfect for quick testing and casual play
   - Progress and stats are not saved

2. **Local accounts**: Username/password authentication
   - Progress and stats are saved
   - Can participate in ranked games

3. **JWT authentication**: Token-based for secure sessions
   - Sessions persist across app restarts
   - Tokens expire as configured in the backend

## Troubleshooting

### Connection Issues

If users experience connection issues:

1. **Network Restrictions**: The system first tries WebSockets, then falls back to HTTP polling. Some networks block WebSockets, but polling should work in nearly all environments.

2. **CORS Issues**: If hosting backend and frontend on different domains, ensure CORS is properly configured in the backend.

3. **Server URL**: Make sure the frontend is attempting to connect to the correct server URL. Check the network tab in developer tools to see connection attempts.

4. **Guest Mode**: Guest mode is designed to work even if MongoDB auth fails, allowing users to play without an account even in case of database issues.

### Guest Login Sequence

1. Frontend initiates connection with `{ isGuest: true }` auth parameter
2. Backend accepts connection without requiring token
3. Backend generates unique guest ID and username
4. Frontend creates temporary user object
5. Multiplayer navigation updates to show lobby

If this sequence fails:
- Check browser console for errors
- Verify backend logs show successful guest authentication
- Ensure you're using the latest version of Socket.IO on both ends

## Best Practices

1. **Error Handling**: Always check for connection before attempting actions
2. **Disconnection Handling**: The app handles disconnections gracefully, attempting to reconnect
3. **Authentication**: Use guest mode for quick testing, but real accounts for production use
4. **Transport**: The system now tries polling first (more reliable in restrictive networks) then upgrades to WebSockets

## Deployment Considerations

When moving to production:

1. **Security**:
   - Update JWT_SECRET in backend .env
   - Enable HTTPS for WebSocket connections
   - Consider rate limiting to prevent abuse

2. **Scalability**:
   - Socket.IO supports horizontal scaling with Redis adapter
   - Consider using sticky sessions if deploying behind a load balancer

3. **Monitoring**:
   - Add logging for connection events
   - Monitor active connections and game states
   - Set up alerts for unusual activity

4. **Connection URLs**:
   - Update SERVER_URLS in SocketService.ts with your production domain
   - Consider environment-specific configuration
