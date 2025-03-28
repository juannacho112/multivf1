# VeeFriends Card Game Backend

This is the backend server for the VeeFriends Card Game, providing:
- RESTful API endpoints
- WebSocket-based real-time multiplayer
- User authentication and game state persistence
- Card game logic

## Architecture

The backend is built using:
- Node.js + Express
- Socket.IO for real-time communication
- MongoDB for data persistence
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Create a `.env` file based on `.env.example`
   - Configure your MongoDB connection settings
   - Set a strong JWT_SECRET for production

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm run start
```

## Environment Configuration

The backend uses a `.env` file for configuration. Create a copy of `.env.example` and modify it to match your environment.

Key settings:

- `PORT`: The port the server will listen on (default: 3000)
- `MONGODB_URI`: MongoDB connection string (preferred approach)
- Individual MongoDB connection parameters (used if MONGODB_URI is not set):
  - `MONGODB_HOST`
  - `MONGODB_PORT`
  - `MONGODB_DATABASE`
  - `MONGODB_USER`
  - `MONGODB_PASSWORD`
  - `MONGODB_AUTH_SOURCE`
- `JWT_SECRET`: Secret key for JWT token generation (change for production!)
- `NODE_ENV`: "development" or "production"

## API Endpoints

The backend provides RESTful API endpoints for:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in an existing user
- `GET /api/auth/verify` - Verify a JWT token

### Users
- `GET /api/users` - Get all users (authenticated)
- `GET /api/users/:id` - Get a specific user (authenticated)
- `PUT /api/users/:id` - Update a user (authenticated, self or admin)

### Games
- `GET /api/games` - Get all games (authenticated)
- `GET /api/games/:id` - Get a specific game (authenticated)
- `POST /api/games` - Create a new game (authenticated)

## WebSocket Events

Socket.IO is used for real-time communication. Key events include:

### Connection Events
- `connected` - Client connected
- `disconnected` - Client disconnected
- `users:list` - List of online users

### Game Events
- `game:create` - Create a new game
- `game:join` - Join an existing game
- `game:joinByCode` - Join a game using a code
- `game:ready` - Player ready to start
- `game:action` - Game actions (drawCards, selectAttribute, etc.)
- `game:stateUpdate` - Game state updates
- `game:ended` - Game has ended

### Matchmaking Events
- `matchmaking:join` - Join the matchmaking queue
- `matchmaking:left` - Leave the matchmaking queue
- `matchmaking:matched` - Matched with another player

## MongoDB Schema

### User Model
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  displayName: String,
  isOnline: Boolean,
  lastActive: Date,
  stats: {
    gamesPlayed: Number,
    gamesWon: Number,
    gamesLost: Number,
    winRate: Number
  }
}
```

### VeefriendsGame Model
```javascript
{
  gameCode: String,
  isPrivate: Boolean,
  status: String ('waiting'|'active'|'completed'|'abandoned'),
  phase: String ('draw'|'challengerPick'|'acceptDeny'|'resolve'|'gameOver'),
  currentChallenger: String ('player1'|'player2'),
  challengeAttribute: String ('skill'|'stamina'|'aura'|'total'|null),
  deniedAttributes: [String],
  availableAttributes: [String],
  cardsInPlay: {
    player1: CardObject,
    player2: CardObject
  },
  burnPile: [CardObject],
  roundNumber: Number,
  potSize: Number,
  players: [PlayerObject],
  winner: String,
  logs: [LogObject]
}
```

## Guest Mode

Guest mode is a key feature that allows users to play without registering. The backend creates temporary user objects with:
- Random UUID as ID
- Generated username like "Guest_1234"
- No persistence in the database

Guest authentication happens through the Socket.IO connection using `{ isGuest: true }` in the auth object.

Guest mode will work even if MongoDB authentication fails, ensuring at least basic functionality in all cases.

## Deployment

### Production Settings

For production deployment:

1. Set these environment variables:
```
NODE_ENV=production
JWT_SECRET=[strong-random-string]
MONGODB_URI=[your-production-mongodb-url]
```

2. Make sure CORS is properly configured for your frontend domain:
```javascript
// server.js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));
```

3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name veefriends-backend
```

### Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the Docker image
docker build -t veefriends-backend .

# Run the container
docker run -p 3000:3000 --env-file .env veefriends-backend
```

### MongoDB Atlas

For easy managed MongoDB hosting:

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Add your IP to the allowed list
4. Create a database user
5. Get your connection string
6. Update your MONGODB_URI in .env

## Scaling Considerations

For handling large numbers of concurrent users:

1. **Socket.IO Clustering**: Use Redis adapter for horizontal scaling
```javascript
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
```

2. **MongoDB Connection Pooling**: Configure connection pool size
```javascript
mongoose.connect(uri, { maxPoolSize: 100 });
```

3. **Load Balancing**: Use sticky sessions if behind a load balancer
```javascript
// In your load balancer config
sticky_sessions on;
```

## Troubleshooting

### Connection Issues
- Check network connectivity
- Verify MongoDB is running
- Check for firewall rules blocking socket connections
- Review MongoDB authentication settings

### Guest Mode Issues
- Check that server.js is accepting guest connections
- Verify Socket.IO auth middleware is handling isGuest=true correctly
- Enable debug logging for Socket.IO

### Game State Sync Issues
- Enable debug logging in `veefriendsSocketService.js`
- Check timestamps on state updates
- Verify two-way communication with client tests

## Security Considerations

1. **JWT Protection**: 
   - Use a strong secret key
   - Set appropriate expiration time
   - Store securely on client side

2. **HTTPS**: 
   - Use TLS/SSL in production
   - Configure secure cookies

3. **Rate Limiting**:
   - Implement rate limiting for API endpoints
   - Protect against connection flooding

4. **Input Validation**:
   - All user inputs are validated
   - Sanitize data to prevent injection attacks

## License

This project is licensed under the MIT License.
