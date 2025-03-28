# VeeFriends Card Game

A cross-platform card battle game built with React Native and Expo, featuring both single player and online multiplayer modes! Challenge opponents with your cards' Skill, Stamina, and Aura attributes.

## Features

### Veefriends Card Game Mode
- Card-based battle system with skill, stamina, and aura attributes
- Turn-based gameplay with challenges and responses
- Single-player mode with AI opponent
- Online multiplayer with real-time gameplay

### Online Multiplayer
- Real-time card battles against other players
- Authentication system with guest access
- Matchmaking system
- Private game rooms with sharable codes
- WebSocket-based game state synchronization

## Technical Implementation

The application is built using:
- React Native with Expo
- TypeScript
- React Context for state management
- Component-based architecture
- Node.js, Express, and Socket.io for the backend
- MongoDB for data persistence

### Project Structure

```
/
├── app/                       # Expo Router app entry point
│   └── (tabs)/                # Tab navigation
│       └── index.tsx          # Main menu screen
│
├── backend/                   # Backend server for multiplayer
│   ├── src/                   # Server source code
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.js        # User model
│   │   │   └── VeefriendsGame.js # Veefriends game model
│   │   ├── routes/            # API routes
│   │   ├── services/          # Services
│   │   │   └── veefriendsSocketService.js # Veefriends socket handling
│   │   ├── utils/             # Utility functions
│   │   │   └── cardUtils.js   # Card generation utilities
│   │   └── server.js          # Main server entry point
│   └── .env                   # Environment variables
│
├── components/
│   ├── battle/                # Battle mode components
│   ├── deckbuilding/          # Deck building components
│   ├── multiplayer/           # Multiplayer components
│   │   ├── contexts/          # State management
│   │   │   └── MultiplayerContext.tsx
│   │   ├── screens/           # Multiplayer screens
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── GameWaitingRoom.tsx
│   │   │   ├── MultiplayerLobbyScreen.tsx
│   │   │   └── OnlineBattleScreen.tsx
│   │   └── services/          # Socket services
│   │       └── SocketService.ts
│   │
│   ├── veefriends/            # Veefriends card game components
│   │   ├── CardComponent.tsx
│   │   ├── GameScreen.tsx
│   │   └── ...
│   │
│   └── MainGame.tsx           # Main game component that coordinates modes
│
├── contexts/                  # Global contexts
│   └── GameContext.tsx        # Game state management
│
└── models/                    # Shared models
    └── Card.ts                # Card type definitions
```

## Game Modes

### Veefriends Card Game
A card game where players use cards with skill, stamina, and aura attributes. Players take turns challenging their opponent with a selected attribute. The opponent can accept or deny the challenge. If all attributes are denied, the "total" attribute is used. Points are awarded in the specific attribute, and the first player to reach 7 points in any attribute wins.

### Online Multiplayer
Players can compete against each other in real-time card battles using WebSockets. The system includes:
- User authentication with optional guest access
- Matchmaking for finding opponents
- Private game rooms with shareable codes
- Real-time game state synchronization
- Support for reconnection after disconnection

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### Local Development Setup

#### Frontend
1. Clone the repository:
```bash
git clone https://github.com/yourusername/veefriends-card-game.git
cd veefriends-card-game
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory (if needed):
```
# Add any frontend environment variables here
```

4. Start the Expo development server:
```bash
npx expo start
```

5. Run on a device or simulator:
- Press 'a' to run on Android
- Press 'i' to run on iOS
- Press 'w' to run on web

#### Backend (for multiplayer)
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the backend directory or modify the existing one:
```
PORT=3000
# MongoDB connection settings
MONGODB_URI=mongodb://localhost:27017/veefriends-game
# Alternative individual connection settings (used if MONGODB_URI is not set)
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=veefriends-game
MONGODB_USER=youruser
MONGODB_PASSWORD=yourpassword
MONGODB_AUTH_SOURCE=admin

# Application settings
JWT_SECRET=your-very-secure-secret-key-change-this
NODE_ENV=development
```

4. Make sure MongoDB is running:
```bash
# If using local MongoDB
mongod
```

5. Start the development server:
```bash
npm run dev
```

6. The backend will be available at http://localhost:3000 by default.

### Development Workflow

For easy development with both frontend and backend running simultaneously, use the provided script:

```bash
./start-dev.sh
```

This script will:
1. Start the backend server
2. Start the Expo development server for the frontend
3. Properly shut down both when interrupted with Ctrl+C

### Production Deployment

#### Backend Deployment

1. Set up a MongoDB Atlas cluster or your preferred MongoDB hosting:
   - Create an account at MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Configure network access (IP whitelist)
   - Create a database user
   - Get your connection string

2. Configure environment variables for production:
   - Update the `.env` file with your production MongoDB URI
   - Set a strong JWT_SECRET
   - Set NODE_ENV=production

3. Deploy to your hosting service:

   **Option 1: Deploy to a VPS (Digital Ocean, AWS EC2, etc.)**
   ```bash
   # Clone repository on your server
   git clone https://github.com/yourusername/veefriends-card-game.git
   cd veefriends-card-game/backend
   
   # Install dependencies
   npm install --production
   
   # Configure environment variables
   # Edit .env with production values
   
   # Start with PM2 or similar process manager
   npm install -g pm2
   pm2 start src/server.js --name veefriends-backend
   ```

   **Option 2: Deploy to Heroku**
   ```bash
   # Install Heroku CLI if not already installed
   npm install -g heroku

   # Login to Heroku
   heroku login
   
   # Create a new app (from backend directory)
   heroku create veefriends-game-api
   
   # Set environment variables
   heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/veefriends?retryWrites=true&w=majority
   heroku config:set JWT_SECRET=your-production-secret
   heroku config:set NODE_ENV=production
   
   # Push to Heroku
   git subtree push --prefix backend heroku main
   ```

4. Update frontend configuration:
   
   In `components/multiplayer/services/SocketService.ts`, update the `SERVER_URLS` array to include your production server URL:

   ```typescript
   const SERVER_URLS = [
     'https://your-production-domain.com', // Production server
     'http://localhost:3000',              // Local development
     // Other URLs...
   ];
   ```

#### Frontend Deployment

1. Configure for production build:

   Update `app.json` with your app details:
   ```json
   {
     "expo": {
       "name": "VeeFriends Card Game",
       "slug": "veefriends-card-game",
       "version": "1.0.0",
       // Other settings...
     }
   }
   ```

2. Build for your target platform:

   **For Expo Go (easiest for testing):**
   ```bash
   expo publish
   ```

   **For standalone apps:**
   ```bash
   # For Android
   expo build:android

   # For iOS
   expo build:ios
   ```

3. Submit to app stores or distribute via Expo's hosting.

## MongoDB Setup

### Local Development

1. Install MongoDB Community Edition:
   - [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - [macOS](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
   - [Linux](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Start MongoDB:
   ```bash
   mongod
   ```

3. Create a database and user:
   ```bash
   # Connect to MongoDB
   mongo
   
   # Create database
   use veefriends-game
   
   # Create user
   db.createUser({
     user: "gameadmin",
     pwd: "secure-password-here",
     roles: [{ role: "readWrite", db: "veefriends-game" }]
   })
   ```

4. Update backend/.env with these credentials.

### Production (MongoDB Atlas)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Set up network access (IP whitelist)
5. Get your connection string and update it in your production environment variables

## Troubleshooting

### Connection Issues

If you're experiencing connection issues with multiplayer:

1. Check that your backend server is running
2. Verify MongoDB connection is working
3. Ensure frontend is correctly pointing to your backend server URL
4. Try using the polling transport first (already implemented in the fixes)
5. Check for any CORS issues if using a different domain for frontend and backend

### Guest Mode

If guest mode isn't working:

1. Ensure the backend server is properly handling guest authentication
2. Check the browser console for any errors
3. The app is configured to retry guest connections automatically
4. Make sure your server allows guest connections without requiring database authentication

## Future Enhancements

- More card types and abilities
- Expanded deck building and card collection features
- Tournament mode
- Spectator functionality
- Friend system with invites
- Animation improvements
- Sound effects and music

## License

This project is licensed under the MIT License - see the LICENSE file for details.
