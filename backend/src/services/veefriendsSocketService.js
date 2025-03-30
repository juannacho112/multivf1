import VeefriendsGame from '../models/VeefriendsGame.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Store for active socket connections
const activeConnections = new Map(); // socketId -> { userId, username, gameId }
// Store for matchmaking queue
const matchmakingQueue = [];
// Store for guest users
const guestUsers = new Map(); // guestId -> { username, displayName }

// Main socket handler function
const setupVeefriendsSocketIO = (io) => {
  // Debug logging for connection events
  io.engine.on('connection', (socket) => {
    console.log(`New raw socket connection: ${socket.id}, transport: ${socket.protocol}`);
  });
  
  // Handle transport change
  io.engine.on('upgrade', (socket) => {
    console.log(`Socket ${socket.id} upgraded transport to: ${socket.protocol}`);
  });
  
  // Enhanced secure authorization middleware for Socket.IO with better error handling
  io.use(async (socket, next) => {
    // Track transport type for debugging purposes
    const transportType = socket.conn?.transport?.name || 'unknown';
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address || 'unknown';
    console.log(`Auth attempt for socket ${socket.id}, transport: ${transportType}, ip: ${ip}`);
    
    try {
      // Check for guest login first
      const isGuest = socket.handshake.auth?.isGuest === true;
      
      if (isGuest) {
        // Generate random guest username with better uniqueness
        const guestId = uuidv4();
        const guestNumber = Math.floor(1000 + Math.random() * 9000);
        const username = `Guest_${guestNumber}`;
        
        // Store guest info with timestamp for potential cleanup later
        guestUsers.set(guestId, {
          username,
          displayName: username,
          createdAt: new Date()
        });
        
        // Attach guest data to socket
        socket.user = {
          id: guestId,
          username,
          displayName: username,
          isGuest: true
        };
        
        console.log(`Guest login successful: ${username} (${guestId}) using ${transportType}`);
        return next();
      }
      
      // If not guest, check for token in different locations (for compatibility)
      let token = socket.handshake.auth?.token;
      
      // Check alternate locations if token not found
      if (!token && socket.handshake.headers?.authorization) {
        // Extract token from Authorization header
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      // Also try query parameter for compatibility with some clients
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }
      
      if (!token) {
        console.log(`Auth failed: No token provided. Conn type: ${transportType}, IP: ${ip}`);
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Validate token
      try {
        // Get JWT secret from environment with proper fallback
        const jwtSecret = process.env.JWT_SECRET || 'veefriends_jwt_secret_default';
        
        // Verify token with proper error handling
        const decoded = jwt.verify(token, jwtSecret);
        
        if (!decoded || !decoded.userId) {
          console.log(`Auth failed: Invalid token payload for socket ${socket.id}`);
          return next(new Error('Authentication error: Invalid token format'));
        }
        
        // Find the user in database with timeout protection
        let user;
        try {
          const userPromise = User.findById(decoded.userId);
          // Add timeout to prevent hanging on DB issues
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 5000)
          );
          
          user = await Promise.race([userPromise, timeoutPromise]);
        } catch (dbError) {
          console.error(`DB error during auth: ${dbError.message}`);
          // Allow connection even if DB is down - use token data
          user = {
            _id: decoded.userId,
            username: decoded.username || 'unknown',
            displayName: decoded.displayName || decoded.username || 'unknown'
          };
          console.log(`Created fallback user from token due to DB error: ${user.username}`);
        }
        
        if (!user) {
          console.log(`Auth warning: User ${decoded.userId} not found in database, using token data`);
          // Create user from token data as fallback
          user = {
            _id: decoded.userId,
            username: decoded.username || 'unknown',
            displayName: decoded.displayName || decoded.username || 'unknown'
          };
        }
        
        // Attach user data to socket
        socket.user = {
          id: user._id,
          username: user.username,
          displayName: user.displayName || user.username,
          isGuest: false
        };
        
        console.log(`Auth successful for user: ${user.username}`);
        next();
      } catch (error) {
        // Handle specific JWT errors with detailed logging
        if (error.name === 'TokenExpiredError') {
          console.log(`Auth failed: Token expired for socket ${socket.id}, transport: ${transportType}`);
          return next(new Error('Authentication error: Token expired'));
        } else if (error.name === 'JsonWebTokenError') {
          console.log(`Auth failed: Invalid token for socket ${socket.id}, error: ${error.message}`);
          return next(new Error('Authentication error: Invalid token'));
        } else {
          console.log(`Auth error for socket ${socket.id}: ${error.message}`);
          return next(new Error(`Authentication error: ${error.message}`));
        }
      }
    } catch (error) {
      console.log(`Unexpected auth error for socket ${socket.id}: ${error.message}, stack: ${error.stack}`);
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });

  // Handle new connections
  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const isGuest = socket.user.isGuest;
    
    console.log(`User connected: ${socket.user.username} (${isGuest ? 'Guest' : userId})`);
    
    // Update user online status if not a guest
    if (!isGuest) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() });
      } catch (error) {
        console.error('Error updating user online status:', error);
      }
    }
    
    // Add to active connections map
    activeConnections.set(socket.id, {
      userId,
      username: socket.user.username,
      displayName: socket.user.displayName,
      isGuest,
      gameId: null
    });
    
    // Handle guest registration from client
    socket.on('guest:register', (data) => {
      const { userId, username, displayName } = data;
      
      // Store guest info with timestamp for potential cleanup later
      guestUsers.set(userId, {
        username,
        displayName: displayName || username,
        createdAt: new Date()
      });
      
      console.log(`Guest registered: ${username} (${userId})`);
      
      // Update active connection data
      const connection = activeConnections.get(socket.id);
      if (connection) {
        connection.username = username;
        connection.displayName = displayName || username;
      }
      
      // Broadcast updated user list
      broadcastUserList(io);
    });
    
    // Send user list to all clients
    broadcastUserList(io);
    
    // MATCHMAKING EVENTS
    
    // Join matchmaking queue
    socket.on('matchmaking:join', async () => {
      // Remove user from queue if already there
      const existingIndex = matchmakingQueue.findIndex(u => u.userId === userId);
      if (existingIndex !== -1) {
        matchmakingQueue.splice(existingIndex, 1);
      }
      
      // Add user to matchmaking queue
      matchmakingQueue.push({
        userId,
        username: socket.user.username,
        displayName: socket.user.displayName,
        socketId: socket.id,
        isGuest: socket.user.isGuest,
        joinedAt: Date.now()
      });
      
      console.log(`${socket.user.username} joined matchmaking. Queue size: ${matchmakingQueue.length}`);
      
      // Notify user they're in queue
      socket.emit('matchmaking:joined', {
        position: matchmakingQueue.length,
        queueSize: matchmakingQueue.length
      });
      
      // Try to find a match
      processMatchmaking(io);
    });
    
    // Leave matchmaking queue
    socket.on('matchmaking:leave', () => {
      const index = matchmakingQueue.findIndex(u => u.userId === userId);
      if (index !== -1) {
        matchmakingQueue.splice(index, 1);
        console.log(`${socket.user.username} left matchmaking. Queue size: ${matchmakingQueue.length}`);
        socket.emit('matchmaking:left');
      }
    });
    
    // GAME EVENTS
    
    // Create a new game
    socket.on('game:create', async (data) => {
      try {
        const { isPrivate = false } = data || {};
        
        const game = new VeefriendsGame({
          isPrivate,
          players: []
        });
        
        // Add the user as a player
        await game.addPlayer({
          _id: isGuest ? null : userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        }, isGuest);
        
        await game.save();
        
        // Join the game room
        socket.join(`game:${game._id}`);
        
        // Update connection mapping
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.gameId = game._id;
        }
        
        // Notify user about game creation
        socket.emit('game:created', {
          gameId: game._id,
          gameCode: game.gameCode,
          players: game.players
        });
        
        console.log(`Game created: ${game._id} (Code: ${game.gameCode})`);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { message: 'Failed to create game' });
      }
    });
    
    // Join game by ID
    socket.on('game:join', async (data) => {
      try {
        const { gameId } = data;
        
        const game = await VeefriendsGame.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        if (game.status !== 'waiting') {
          return socket.emit('error', { message: 'Game already started or completed' });
        }
        
        // Add player to game
        await game.addPlayer({
          _id: isGuest ? null : userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        }, isGuest);
        
        await game.save();
        
        // Join the game room
        socket.join(`game:${game._id}`);
        
        // Update connection mapping
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.gameId = game._id;
        }
        
        // Notify all players in the game
        io.to(`game:${game._id}`).emit('game:playerJoined', {
          gameId: game._id,
          player: {
            userId: socket.user.id,
            username: socket.user.username,
            displayName: socket.user.displayName,
            isGuest: socket.user.isGuest
          },
          players: game.players
        });
        
        // If game is now full, notify all players
        if (game.players.length === 2) {
          io.to(`game:${game._id}`).emit('game:ready', {
            gameId: game._id,
            players: game.players
          });
        }
        
        console.log(`${socket.user.username} joined game: ${game._id}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: error.message || 'Failed to join game' });
      }
    });
    
    // Join game by code
    socket.on('game:joinByCode', async (data) => {
      try {
        const { gameCode } = data;
        
        const game = await VeefriendsGame.findOne({ gameCode });
        if (!game) {
          return socket.emit('error', { message: 'Game not found with that code' });
        }
        
        if (game.status !== 'waiting') {
          return socket.emit('error', { message: 'Game already started or completed' });
        }
        
        // Add player to game
        await game.addPlayer({
          _id: isGuest ? null : userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        }, isGuest);
        
        await game.save();
        
        // Join the game room
        socket.join(`game:${game._id}`);
        
        // Update connection mapping
        const connection = activeConnections.get(socket.id);
        if (connection) {
          connection.gameId = game._id;
        }
        
        // Notify all players in the game
        io.to(`game:${game._id}`).emit('game:playerJoined', {
          gameId: game._id,
          player: {
            userId: socket.user.id,
            username: socket.user.username,
            displayName: socket.user.displayName,
            isGuest: socket.user.isGuest
          },
          players: game.players
        });
        
        // If game is now full, notify all players
        if (game.players.length === 2) {
          io.to(`game:${game._id}`).emit('game:ready', {
            gameId: game._id,
            players: game.players
          });
        }
        
        console.log(`${socket.user.username} joined game by code: ${gameCode}`);
      } catch (error) {
        console.error('Error joining game by code:', error);
        socket.emit('error', { message: error.message || 'Failed to join game' });
      }
    });
    
    // Player ready
    socket.on('game:ready', async (data) => {
      try {
        const { gameId } = data;
        
        const game = await VeefriendsGame.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Find player index based on socket's user ID
        const playerIndex = game.players.findIndex(p => {
          if (isGuest) {
            // For guest players, match username since there's no persistent userId
            return p.isGuest && p.username === socket.user.username;
          } else {
            // For authenticated users, match userId
            return p.userId && p.userId.toString() === userId.toString();
          }
        });
        
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'You are not in this game' });
        }
        
        // Set player as ready
        game.players[playerIndex].isReady = true;
        
        // Generate deck for player if not already set
        if (!game.players[playerIndex].deck || game.players[playerIndex].deck.length === 0) {
          try {
            // Import cards dynamically to avoid circular dependencies
            const { generateRandomDeck, fullCardPool } = await import('../utils/cardUtils.js');
            
            // Generate the deck as proper objects
            const generatedDeck = generateRandomDeck(fullCardPool, 20);
            console.log(`Generated deck for ${game.players[playerIndex].username} with ${generatedDeck.length} cards`);
            
            // CRITICAL FIX: Ensure deck is an array of card objects, not stringified
            // We need to manually set each card in the array to ensure proper MongoDB handling
            game.players[playerIndex].deck = [];
            generatedDeck.forEach(card => {
              game.players[playerIndex].deck.push({
                id: card.id,
                name: card.name,
                skill: Number(card.skill),
                stamina: Number(card.stamina),
                aura: Number(card.aura),
                baseTotal: Number(card.baseTotal),
                finalTotal: Number(card.finalTotal),
                rarity: String(card.rarity),
                character: String(card.character),
                type: card.type ? String(card.type) : 'standard',
                unlocked: Boolean(card.unlocked)
              });
            });
          } catch (error) {
            console.error('Error generating deck:', error);
            // Provide a minimal fallback deck if needed
            game.players[playerIndex].deck = [];
          }
        }
        
        // Use a try-catch block specifically for the save operation
        try {
          await game.save();
        } catch (saveError) {
          console.error('Error saving player ready status:', saveError);
          // Send more specific error to client
          return socket.emit('error', { message: 'Failed to set ready status - Database error' });
        }
        
        // Notify all players in the game
        io.to(`game:${gameId}`).emit('game:playerReady', {
          gameId,
          userId: socket.user.id,
          username: socket.user.username,
          allReady: game.isReadyToStart()
        });
        
        // If all players are ready, start the game
        if (game.isReadyToStart()) {
          await startGame(io, game);
        }
      } catch (error) {
        console.error('Error setting player ready:', error);
        socket.emit('error', { message: 'Failed to set ready status' });
      }
    });
    
    // Game actions
    socket.on('game:action', async (data) => {
      try {
        const { gameId, action, payload } = data;
        
        // Validate that user is in the game
        const game = await VeefriendsGame.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Find player index
        const playerIndex = game.players.findIndex(p => {
          if (isGuest) {
            // For guest players, match username
            return p.isGuest && p.username === socket.user.username;
          } else {
            // For authenticated users, match userId
            return p.userId && p.userId.toString() === userId.toString();
          }
        });
        
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'You are not in this game' });
        }
        
        // Determine player position (player1 or player2)
        const playerPosition = playerIndex === 0 ? 'player1' : 'player2';
        
        // Process the game action
        const result = await processGameAction(game, playerPosition, action, payload);
        
        // Broadcast the action result to all players in the game
        io.to(`game:${gameId}`).emit('game:actionResult', {
          gameId,
          action,
          result
        });
        
        // If the game state changed, save it
        if (result.gameStateChanged) {
          await game.save();
        }
        
        // If the game ended, handle game end
        if (result.gameEnded) {
          await handleGameEnd(io, game, result.winner);
        }
      } catch (error) {
        console.error('Error processing game action:', error);
        socket.emit('error', { message: 'Failed to process game action' });
      }
    });
    
    // DISCONNECT HANDLING
    
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      // Update user online status if not guest
      if (!isGuest) {
        try {
          await User.findByIdAndUpdate(userId, { 
            isOnline: false, 
            lastActive: new Date() 
          });
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
      } else {
        // Remove guest user data
        if (guestUsers.has(userId)) {
          guestUsers.delete(userId);
        }
      }
      
      // Handle ongoing game
      const connection = activeConnections.get(socket.id);
      if (connection && connection.gameId) {
        await handlePlayerDisconnect(io, userId, connection.gameId, isGuest, socket.user.username);
      }
      
      // Remove from matchmaking queue if present
      const queueIndex = matchmakingQueue.findIndex(u => u.userId === userId);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
        console.log(`${socket.user.username} removed from matchmaking queue. Queue size: ${matchmakingQueue.length}`);
      }
      
      // Remove from active connections
      activeConnections.delete(socket.id);
      
      // Broadcast updated user list
      broadcastUserList(io);
    });
  });
};

// HELPER FUNCTIONS

// Broadcast online users list
const broadcastUserList = async (io) => {
  try {
    const onlineUsers = Array.from(activeConnections.values()).map(conn => ({
      userId: conn.userId,
      username: conn.username,
      displayName: conn.displayName,
      isGuest: conn.isGuest,
      inGame: !!conn.gameId
    }));
    
    io.emit('users:list', { users: onlineUsers });
  } catch (error) {
    console.error('Error broadcasting user list:', error);
  }
};

// Process matchmaking queue
const processMatchmaking = async (io) => {
  if (matchmakingQueue.length < 2) return;
  
  // Sort queue by join time (oldest first)
  matchmakingQueue.sort((a, b) => a.joinedAt - b.joinedAt);
  
  // Take first two players
  const player1 = matchmakingQueue.shift();
  const player2 = matchmakingQueue.shift();
  
  try {
    // Create new game
    const game = new VeefriendsGame({
      isPrivate: false,
    });
    
    // Add players
    await game.addPlayer({
      _id: player1.isGuest ? null : player1.userId,
      username: player1.username,
      displayName: player1.displayName
    }, player1.isGuest);
    
    await game.addPlayer({
      _id: player2.isGuest ? null : player2.userId,
      username: player2.username,
      displayName: player2.displayName
    }, player2.isGuest);
    
    game.status = 'waiting';
    await game.save();
    
    // Notify both players
    const player1Socket = io.sockets.sockets.get(player1.socketId);
    const player2Socket = io.sockets.sockets.get(player2.socketId);
    
    console.log(`Matchmaking: Found sockets for player1: ${!!player1Socket}, player2: ${!!player2Socket}`);
    
    if (player1Socket) {
      player1Socket.join(`game:${game._id}`);
      console.log(`Player 1 (${player1.username}) joined room game:${game._id}`);
      
      // Send matched event
      player1Socket.emit('matchmaking:matched', {
        gameId: game._id,
        opponent: {
          userId: player2.userId,
          username: player2.username,
          displayName: player2.displayName,
          isGuest: player2.isGuest
        }
      });
      
      console.log(`Sent matchmaking:matched event to player1 (${player1.username})`);
      
      // Update connection mapping
      const connection = activeConnections.get(player1.socketId);
      if (connection) {
        connection.gameId = game._id;
        console.log(`Updated connection mapping for player1 (${player1.username}) with gameId ${game._id}`);
      }
    }
    
    if (player2Socket) {
      player2Socket.join(`game:${game._id}`);
      console.log(`Player 2 (${player2.username}) joined room game:${game._id}`);
      
      // Send matched event
      player2Socket.emit('matchmaking:matched', {
        gameId: game._id,
        opponent: {
          userId: player1.userId,
          username: player1.username,
          displayName: player1.displayName,
          isGuest: player1.isGuest
        }
      });
      
      console.log(`Sent matchmaking:matched event to player2 (${player2.username})`);
      
      // Update connection mapping
      const connection = activeConnections.get(player2.socketId);
      if (connection) {
        connection.gameId = game._id;
        console.log(`Updated connection mapping for player2 (${player2.username}) with gameId ${game._id}`);
      }
    }
    
    console.log(`Matchmaking: Created game ${game._id} between ${player1.username} and ${player2.username}`);
    
    // CRITICAL: Delay game:created event slightly to ensure clients have processed matchmaking:matched events
    setTimeout(() => {
      console.log(`Emitting game:created event to room game:${game._id}`);
      
      // Notify both players the game is ready
      io.to(`game:${game._id}`).emit('game:created', {
        gameId: game._id,
        gameCode: game.gameCode,
        players: game.players
      });
      
      console.log(`Game:created event emitted successfully`);
      
      // Force setting both players as ready to automatically start the game
      console.log(`Auto-setting both players as ready to start game`);
      game.players[0].isReady = true;
      game.players[1].isReady = true;
      game.save().then(() => {
        // Start game directly
        console.log(`Starting game ${game._id} automatically`);
        startGame(io, game);
      });
    }, 500); // 500ms delay
  } catch (error) {
    console.error('Error in matchmaking:', error);
    
    // Put players back in queue
    if (player1) matchmakingQueue.unshift(player1);
    if (player2) matchmakingQueue.unshift(player2);
  }
};

// Start a game
const startGame = async (io, game) => {
  // Import cards dynamically to avoid circular dependencies
  const { generateRandomDeck, fullCardPool } = await import('../utils/cardUtils.js');
  
  // Initialize game state
  game.status = 'active';
  game.phase = 'draw';
  game.roundNumber = 1;
  game.potSize = 1;
  game.currentChallenger = 'player1';
  game.challengeAttribute = null;
  game.deniedAttributes = [];
  game.availableAttributes = ['skill', 'stamina', 'aura'];
  game.cardsInPlay = { player1: null, player2: null };
  
  // Initialize player decks if not already set
  for (let i = 0; i < game.players.length; i++) {
    if (!game.players[i].deck || game.players[i].deck.length === 0) {
      game.players[i].deck = generateRandomDeck(fullCardPool, 20);
    }
    
    // Reset player points and terrific token
    game.players[i].points = { skill: 0, stamina: 0, aura: 0 };
    game.players[i].terrificTokenUsed = false;
  }
  
  await game.save();
  
  // Notify all players that game has started
  io.to(`game:${game._id}`).emit('game:started', {
    gameId: game._id,
    gameState: game.getGameState()
  });
  
  console.log(`Game started: ${game._id}`);
  
  // Start the first round by drawing cards
  try {
    await processGameAction(game, 'player1', 'drawCards');
    await game.save();
  } catch (error) {
    console.error('Error processing first draw:', error);
    // Send error notification to players
    io.to(`game:${game._id}`).emit('error', { 
      message: 'Failed to start game properly. Please try again.' 
    });
  }
  
  // Send updated game state after drawing cards
  io.to(`game:${game._id}`).emit('game:stateUpdate', {
    gameId: game._id,
    gameState: game.getGameState()
  });
};

// Handle player disconnect during game
const handlePlayerDisconnect = async (io, userId, gameId, isGuest, username) => {
  try {
    const game = await VeefriendsGame.findById(gameId);
    if (!game || game.status === 'completed') return;
    
    // Find player in game
    const playerIndex = game.players.findIndex(p => {
      if (isGuest) {
        // For guests, match by username
        return p.isGuest && p.username === username;
      } else {
        // For authenticated users, match by userId
        return p.userId && p.userId.toString() === userId.toString();
      }
    });
    
    if (playerIndex === -1) return;
    
    // If game was active, mark as abandoned and notify other player
    if (game.status === 'active') {
      game.status = 'abandoned';
      
      // Set the other player as winner
      const winnerIndex = (playerIndex + 1) % 2;
      game.winner = playerIndex === 0 ? 'player2' : 'player1';
      
      await handleGameEnd(io, game, game.winner);
      
      await game.save();
      
      // Notify remaining players
      io.to(`game:${gameId}`).emit('game:playerLeft', {
        gameId,
        userId,
        username,
        isGuest,
        status: 'abandoned'
      });
      
      console.log(`Game ${gameId} abandoned due to player disconnect`);
    } 
    // If game was waiting, allow the other player to leave or wait for reconnect
    else if (game.status === 'waiting') {
      // Notify remaining player
      io.to(`game:${gameId}`).emit('game:playerLeft', {
        gameId,
        userId,
        username,
        isGuest,
        status: 'waiting'
      });
    }
  } catch (error) {
    console.error('Error handling player disconnect:', error);
  }
};

// Handle game end
const handleGameEnd = async (io, game, winner) => {
  try {
    game.status = 'completed';
    game.phase = 'gameOver';
    game.winner = winner;
    
    // Update player stats for non-guest users
    for (let i = 0; i < game.players.length; i++) {
      const player = game.players[i];
      
      // Only process non-guest users with valid userId
      if (!player.isGuest && player.userId) {
        try {
          const user = await User.findById(player.userId);
          if (user) {
            // Initialize stats object if it doesn't exist
            if (!user.stats) {
              user.stats = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 };
            }
            
            user.stats.gamesPlayed = (user.stats.gamesPlayed || 0) + 1;
            
            const playerPosition = i === 0 ? 'player1' : 'player2';
            if (winner === playerPosition) {
              user.stats.gamesWon = (user.stats.gamesWon || 0) + 1;
            } else {
              user.stats.gamesLost = (user.stats.gamesLost || 0) + 1;
            }
            
            await user.save();
          }
        } catch (error) {
          console.error(`Error updating stats for user ${player.username}:`, error);
        }
      }
    }
    
    await game.save();
    
    // Notify players
    io.to(`game:${game._id}`).emit('game:ended', {
      gameId: game._id,
      winner,
      gameState: game.getGameState()
    });
    
    console.log(`Game ${game._id} ended. Winner: ${winner}`);
  } catch (error) {
    console.error('Error handling game end:', error);
  }
};

// Process game actions - implements Veefriends game logic
const processGameAction = async (game, playerPosition, action, payload = {}) => {
  // Default response structure
  const response = {
    success: false,
    message: '',
    gameStateChanged: false,
    gameEnded: false,
    winner: null,
    gameState: null
  };
  
  try {
    // Handle specific game actions
    switch (action) {
      case 'drawCards': {
        // Check if both players have cards left
        if (game.players[0].deck.length === 0 || game.players[1].deck.length === 0) {
          // If either player is out of cards, game over
          game.phase = 'gameOver';
          game.winner = game.players[0].deck.length > 0 ? 'player1' : 'player2';
          
          response.success = true;
          response.message = 'Game over: A player ran out of cards';
          response.gameStateChanged = true;
          response.gameEnded = true;
          response.winner = game.winner;
          response.gameState = game.getGameState();
          return response;
        }
        
        // Draw cards for both players
        const player1Card = game.players[0].deck[0];
        const player2Card = game.players[1].deck[0];
        
        // Update game state
        game.cardsInPlay = {
          player1: player1Card,
          player2: player2Card
        };
        
        // Remove cards from decks
        game.players[0].deck = game.players[0].deck.slice(1);
        game.players[1].deck = game.players[1].deck.slice(1);
        
        // Move to challenge phase
        game.phase = 'challengerPick';
        game.deniedAttributes = [];
        game.availableAttributes = ['skill', 'stamina', 'aura'];
        
        response.success = true;
        response.message = 'Cards drawn';
        response.gameStateChanged = true;
        response.gameState = game.getGameState();
        return response;
      }
      
      case 'selectAttribute': {
        // Verify it's this player's turn to choose
        if (game.currentChallenger !== playerPosition) {
          response.message = 'Not your turn to select attribute';
          return response;
        }
        
        // Get attribute from payload
        const { attribute, useTerrificToken } = payload;
        
        if (!attribute) {
          response.message = 'No attribute specified';
          return response;
        }
        
        // Check if attribute is valid
        if (!game.availableAttributes.includes(attribute) && attribute !== 'total') {
          response.message = 'Invalid attribute selected';
          return response;
        }
        
        // Handle terrific token if used
        if (useTerrificToken) {
          const playerIndex = playerPosition === 'player1' ? 0 : 1;
          
          // Check if token already used
          if (game.players[playerIndex].terrificTokenUsed) {
            response.message = 'Terrific token already used';
            return response;
          }
          
          // Use the token to force total as the challenge attribute
          game.players[playerIndex].terrificTokenUsed = true;
          game.challengeAttribute = 'total';
          game.phase = 'resolve'; // Skip accept/deny phase
          
          response.success = true;
          response.message = 'Terrific token used to select total attribute';
          response.gameStateChanged = true;
          response.gameState = game.getGameState();
          return response;
        }
        
        // Regular attribute selection
        game.challengeAttribute = attribute;
        game.phase = 'acceptDeny';
        
        response.success = true;
        response.message = `Attribute selected: ${attribute}`;
        response.gameStateChanged = true;
        response.gameState = game.getGameState();
        return response;
      }
      
      case 'respondToChallenge': {
        // Verify it's response phase and player is not the challenger
        if (game.phase !== 'acceptDeny') {
          response.message = 'Not in accept/deny phase';
          return response;
        }
        
        // The responder should be the player who is not the current challenger
        if (game.currentChallenger === playerPosition) {
          response.message = 'You cannot respond to your own challenge';
          return response;
        }
        
        const { accept } = payload;
        
        if (accept === undefined) {
          response.message = 'Accept/deny decision not specified';
          return response;
        }
        
        if (accept) {
          // Accepted challenge, move to resolve phase
          game.phase = 'resolve';
          
          response.success = true;
          response.message = 'Challenge accepted';
          response.gameStateChanged = true;
          response.gameState = game.getGameState();
          return response;
        } else {
          // Denied challenge
          if (!game.challengeAttribute) {
            response.message = 'No challenge attribute to deny';
            return response;
          }
          
          // Add attribute to denied list
          game.deniedAttributes.push(game.challengeAttribute);
          
          // Remove attribute from available list
          game.availableAttributes = game.availableAttributes.filter(attr => attr !== game.challengeAttribute);
          
          // If all attributes are denied, force resolution with total
          if (game.availableAttributes.length === 0) {
            game.phase = 'resolve';
            game.challengeAttribute = 'total';
            
            response.success = true;
            response.message = 'All attributes denied, using total';
            response.gameStateChanged = true;
            response.gameState = game.getGameState();
            return response;
          }
          
          // Otherwise, switch challenger and return to challenger pick phase
          game.phase = 'challengerPick';
          game.challengeAttribute = null;
          game.currentChallenger = game.currentChallenger === 'player1' ? 'player2' : 'player1';
          
          response.success = true;
          response.message = 'Challenge denied';
          response.gameStateChanged = true;
          response.gameState = game.getGameState();
          return response;
        }
      }
      
      case 'resolveChallenge': {
        // Verify it's resolve phase
        if (game.phase !== 'resolve') {
          response.message = 'Not in resolve phase';
          return response;
        }
        
        const { player1, player2, cardsInPlay, challengeAttribute, potSize } = game;
        
        if (!cardsInPlay.player1 || !cardsInPlay.player2 || !challengeAttribute) {
          response.message = 'Missing cards or challenge attribute';
          return response;
        }
        
        // Determine winner
        let roundWinner = null;
        let player1Value, player2Value;
        
        if (challengeAttribute === 'total') {
          player1Value = cardsInPlay.player1.finalTotal;
          player2Value = cardsInPlay.player2.finalTotal;
        } else {
          player1Value = cardsInPlay.player1[challengeAttribute] || 0;
          player2Value = cardsInPlay.player2[challengeAttribute] || 0;
        }
        
        if (player1Value > player2Value) {
          roundWinner = 'player1';
        } else if (player2Value > player1Value) {
          roundWinner = 'player2';
        }
        
        // Update points based on the challenge outcome
        const player1Index = 0;
        const player2Index = 1;
        
        // Handle different point awarding based on situation
        if (roundWinner) {
          if (challengeAttribute === 'total') {
            // For Total challenges (terrific token or all attributes denied), award 1 point in each attribute
            if (roundWinner === 'player1') {
              game.players[player1Index].points.skill += 1;
              game.players[player1Index].points.stamina += 1;
              game.players[player1Index].points.aura += 1;
            } else {
              game.players[player2Index].points.skill += 1;
              game.players[player2Index].points.stamina += 1;
              game.players[player2Index].points.aura += 1;
            }
          } else {
            // For regular attribute challenges, award points only for the specific attribute
            if (roundWinner === 'player1') {
              game.players[player1Index].points[challengeAttribute] += potSize; // Award pot size as points
            } else {
              game.players[player2Index].points[challengeAttribute] += potSize; // Award pot size as points
            }
          }
          
          // Add cards to burn pile
          if (!game.burnPile) game.burnPile = [];
          if (cardsInPlay.player1) game.burnPile.push(cardsInPlay.player1);
          if (cardsInPlay.player2) game.burnPile.push(cardsInPlay.player2);
          
          // Check for game winner
          const gameWinner = 
            Object.values(game.players[player1Index].points).some(p => p >= 7) ? 'player1' :
            Object.values(game.players[player2Index].points).some(p => p >= 7) ? 'player2' : 
            null;
          
          if (gameWinner) {
            game.phase = 'gameOver';
            game.winner = gameWinner;
            
            response.success = true;
            response.message = `Game over! ${gameWinner} wins!`;
            response.gameStateChanged = true;
            response.gameEnded = true;
            response.winner = gameWinner;
            response.gameState = game.getGameState();
            return response;
          }
          
          // Reset for next round
          game.cardsInPlay = { player1: null, player2: null };
          game.phase = 'draw';
          game.roundNumber += 1;
          game.currentChallenger = game.currentChallenger === 'player1' ? 'player2' : 'player1';
          game.potSize = 1; // Reset pot size after a non-tie round
          game.challengeAttribute = null;
          
          response.success = true;
          response.message = `Round winner: ${roundWinner}`;
          response.gameStateChanged = true;
          response.gameState = game.getGameState();
          return response;
        } else {
          // In case of a tie, increase the pot size for next round
          // Add cards to burn pile
          if (!game.burnPile) game.burnPile = [];
          if (cardsInPlay.player1) game.burnPile.push(cardsInPlay.player1);
          if (cardsInPlay.player2) game.burnPile.push(cardsInPlay.player2);
          
          game.cardsInPlay = { player1: null, player2: null };
          game.phase = 'draw';
          game.roundNumber += 1;
          game.currentChallenger = game.currentChallenger === 'player1' ? 'player2' : 'player1';
          game.potSize = game.potSize + 1; // Increase pot size on a tie
          game.challengeAttribute = null;
          
          response.success = true;
          response.message = 'Tie! Pot increased.';
          response.gameStateChanged = true;
          response.gameState = game.getGameState();
          return response;
        }
      }
      
      default: {
        response.message = `Unknown action: ${action}`;
        return response;
      }
    }
  } catch (error) {
    console.error('Error processing game action:', error);
    response.message = `Error: ${error.message}`;
    return response;
  }
};

export default setupVeefriendsSocketIO;
