import Game from '../models/Game.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Store for active socket connections
const activeConnections = new Map(); // socketId -> { userId, username, gameId }
// Store for matchmaking queue
const matchmakingQueue = [];

// Main socket handler function
const setupSocketIO = (io) => {
  // Authorization middleware for Socket.IO
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    // Allow guest connections without a token
    const isGuest = socket.handshake.auth.isGuest === true;
    
    if (isGuest) {
      // Generate random guest username
      const guestId = uuidv4();
      const guestNumber = Math.floor(1000 + Math.random() * 9000);
      const username = `Guest_${guestNumber}`;
      
      // Attach guest data to socket
      socket.user = {
        id: guestId,
        username,
        displayName: username,
        isGuest: true
      };
      
      return next();
    }
    
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.user = {
        id: user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        isGuest: false
      };
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
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
      gameId: null
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
        
        const game = new Game({
          isPrivate,
          players: [{
            userId,
            username: socket.user.username,
            displayName: socket.user.displayName,
            isReady: false
          }]
        });
        
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
          gameCode: game.gameCode
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
        
        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        if (game.status !== 'waiting') {
          return socket.emit('error', { message: 'Game already started or completed' });
        }
        
        // Add player to game
        await game.addPlayer({
          _id: userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        });
        
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
            userId,
            username: socket.user.username,
            displayName: socket.user.displayName
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
        
        const game = await Game.findOne({ gameCode });
        if (!game) {
          return socket.emit('error', { message: 'Game not found with that code' });
        }
        
        if (game.status !== 'waiting') {
          return socket.emit('error', { message: 'Game already started or completed' });
        }
        
        // Add player to game
        await game.addPlayer({
          _id: userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        });
        
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
            userId,
            username: socket.user.username,
            displayName: socket.user.displayName
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
        
        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        // Find player and set ready status
        const playerIndex = game.players.findIndex(
          p => p.userId.toString() === userId.toString()
        );
        
        if (playerIndex === -1) {
          return socket.emit('error', { message: 'You are not in this game' });
        }
        
        game.players[playerIndex].isReady = true;
        await game.save();
        
        // Notify all players in the game
        io.to(`game:${gameId}`).emit('game:playerReady', {
          gameId,
          userId,
          username: socket.user.username,
          allReady: game.isReadyToStart()
        });
        
        // If all players are ready, start the game
        if (game.isReadyToStart()) {
          startGame(io, game);
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
        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit('error', { message: 'Game not found' });
        }
        
        const player = game.players.find(
          p => p.userId.toString() === userId.toString()
        );
        
        if (!player) {
          return socket.emit('error', { message: 'You are not in this game' });
        }
        
        // Process the game action
        const result = await processGameAction(game, userId, action, payload);
        
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
      if (!socket.user.isGuest) {
        try {
          await User.findByIdAndUpdate(userId, { 
            isOnline: false, 
            lastActive: new Date() 
          });
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
      }
      
      // Handle ongoing game
      const connection = activeConnections.get(socket.id);
      if (connection && connection.gameId) {
        await handlePlayerDisconnect(io, userId, connection.gameId, socket.user.isGuest, socket.user.username);
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
    const game = new Game({
      isPrivate: false,
      players: [
        {
          userId: player1.userId,
          username: player1.username,
          displayName: player1.displayName,
          isReady: false
        },
        {
          userId: player2.userId,
          username: player2.username,
          displayName: player2.displayName,
          isReady: false
        }
      ],
      status: 'waiting'
    });
    
    await game.save();
    
    // Notify both players
    const player1Socket = io.sockets.sockets.get(player1.socketId);
    const player2Socket = io.sockets.sockets.get(player2.socketId);
    
    if (player1Socket) {
      player1Socket.join(`game:${game._id}`);
      player1Socket.emit('matchmaking:matched', {
        gameId: game._id,
        opponent: {
          userId: player2.userId,
          username: player2.username,
          displayName: player2.displayName
        }
      });
      
      // Update connection mapping
      const connection = activeConnections.get(player1.socketId);
      if (connection) {
        connection.gameId = game._id;
      }
    }
    
    if (player2Socket) {
      player2Socket.join(`game:${game._id}`);
      player2Socket.emit('matchmaking:matched', {
        gameId: game._id,
        opponent: {
          userId: player1.userId,
          username: player1.username,
          displayName: player1.displayName
        }
      });
      
      // Update connection mapping
      const connection = activeConnections.get(player2.socketId);
      if (connection) {
        connection.gameId = game._id;
      }
    }
    
    console.log(`Matchmaking: Created game ${game._id} between ${player1.username} and ${player2.username}`);
    
    // Notify both players the game is ready
    io.to(`game:${game._id}`).emit('game:created', {
      gameId: game._id,
      gameCode: game.gameCode,
      players: game.players
    });
  } catch (error) {
    console.error('Error in matchmaking:', error);
    
    // Put players back in queue
    if (player1) matchmakingQueue.unshift(player1);
    if (player2) matchmakingQueue.unshift(player2);
  }
};

// Start a game
const startGame = async (io, game) => {
  // Initialize game state
  game.status = 'active';
  game.currentTurn = 1;
  game.activePlayerId = game.players[0].userId;
  
  // Initialize player decks, hands, etc.
  // This would be expanded with actual game logic
  for (let i = 0; i < game.players.length; i++) {
    game.players[i].energy = 3;
    game.players[i].maxEnergy = 3;
    
    // Here you would initialize decks from player collection
    // For now, we just create placeholder
    game.players[i].deck = Array(10).fill({
      id: `placeholder-${i}-${uuidv4()}`,
      name: 'Placeholder Card',
      type: 'placeholder'
    });
    
    // Draw initial hand (3 cards)
    game.players[i].hand = game.players[i].deck.splice(0, 3);
  }
  
  await game.save();
  
  // Notify all players that game has started
  io.to(`game:${game._id}`).emit('game:started', {
    gameId: game._id,
    activePlayerId: game.activePlayerId,
    currentTurn: game.currentTurn,
    // Send full game state to players
    gameState: getGameStateForPlayers(game)
  });
  
  console.log(`Game started: ${game._id}`);
};

// Handle player disconnect during game
const handlePlayerDisconnect = async (io, userId, gameId, isGuest = false, username = null) => {
  try {
    const game = await Game.findById(gameId);
    if (!game || game.status === 'completed') return;
    
    // Find the player in the game
    const playerIndex = isGuest 
      ? game.players.findIndex(p => p.username === username)
      : game.players.findIndex(p => p.userId && p.userId.toString() === userId.toString());
    
    if (playerIndex === -1) return;
    
    // If game was active, mark as abandoned and notify other player
    if (game.status === 'active') {
      game.status = 'abandoned';
      
      // Set the other player as winner
      const winnerIndex = (playerIndex + 1) % game.players.length;
      if (game.players[winnerIndex] && game.players[winnerIndex].userId) {
        game.winner = game.players[winnerIndex].userId;
        await handleGameEnd(io, game, game.players[winnerIndex].userId);
      }
      
      await game.save();
      
      // Notify remaining players
      io.to(`game:${gameId}`).emit('game:playerLeft', {
        gameId,
        userId,
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
        status: 'waiting'
      });
    }
  } catch (error) {
    console.error('Error handling player disconnect:', error);
  }
};

// Handle game end
const handleGameEnd = async (io, game, winnerId) => {
  try {
    game.status = 'completed';
    game.winner = winnerId;
    
    // Update player stats for non-guest players only
    for (const player of game.players) {
      // Skip guest users or null userId values
      if (!player.userId) continue;
      
      try {
        const user = await User.findById(player.userId);
        if (user) {
          // Initialize stats object if it doesn't exist
          if (!user.stats) {
            user.stats = { gamesPlayed: 0, gamesWon: 0, gamesLost: 0 };
          }
          
          user.stats.gamesPlayed += 1;
          
          if (player.userId.toString() === winnerId.toString()) {
            user.stats.gamesWon += 1;
          } else {
            user.stats.gamesLost += 1;
          }
          
          // Check if updateWinRate method exists
          if (typeof user.updateWinRate === 'function') {
            user.updateWinRate();
          }
          
          await user.save();
        }
      } catch (error) {
        console.error(`Error updating stats for user ${player.username}:`, error);
      }
    }
    
    await game.save();
    
    // Notify players
    io.to(`game:${game._id}`).emit('game:ended', {
      gameId: game._id,
      winner: {
        userId: winnerId,
        username: game.players.find(p => p.userId.toString() === winnerId.toString())?.username
      }
    });
    
    console.log(`Game ${game._id} ended. Winner: ${winnerId}`);
  } catch (error) {
    console.error('Error handling game end:', error);
  }
};

// Get game state for players (with private information filtered)
const getGameStateForPlayers = (game) => {
  return {
    gameId: game._id,
    status: game.status,
    currentTurn: game.currentTurn,
    activePlayerId: game.activePlayerId,
    players: game.players.map(player => ({
      userId: player.userId,
      username: player.username,
      displayName: player.displayName,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
      deckCount: player.deck.length,
      discardCount: player.discardPile.length,
      field: player.field,
      // Only include hand cards if they belong to the player
      hand: player.hand // This will be filtered on the client side
    }))
  };
};

// Process game actions
const processGameAction = async (game, playerId, action, payload) => {
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
    // Check if it's the player's turn
    const isPlayerTurn = game.activePlayerId.toString() === playerId.toString();
    
    if (!isPlayerTurn && action !== 'chat') {
      response.message = 'Not your turn';
      return response;
    }
    
    // Process different action types
    switch (action) {
      case 'playCard':
        // Handle playing a card
        const { cardId } = payload;
        return await handlePlayCard(game, playerId, cardId);
      
      case 'useAbility':
        // Handle using an ability
        const { sourceCardId, abilityId, targetCardId } = payload;
        return await handleUseAbility(game, playerId, sourceCardId, abilityId, targetCardId);
      
      case 'endTurn':
        // Handle ending turn
        return await handleEndTurn(game, playerId);
      
      case 'chat':
        // Handle chat message (doesn't change game state)
        const { message } = payload;
        game.logs.push({
          message: `${game.players.find(p => p.userId.toString() === playerId.toString())?.username}: ${message}`,
          timestamp: new Date()
        });
        
        response.success = true;
        response.message = 'Chat message sent';
        return response;
      
      default:
        response.message = 'Unknown action';
        return response;
    }
  } catch (error) {
    console.error('Error processing game action:', error);
    response.message = 'Error processing action';
    return response;
  }
};

// Handle playing a card
const handlePlayCard = async (game, playerId, cardId) => {
  const response = {
    success: false,
    message: '',
    gameStateChanged: false,
    gameEnded: false,
    winner: null,
    gameState: null
  };
  
  try {
    // Find player
    const playerIndex = game.players.findIndex(
      p => p.userId.toString() === playerId.toString()
    );
    
    if (playerIndex === -1) {
      response.message = 'Player not found in game';
      return response;
    }
    
    const player = game.players[playerIndex];
    
    // Find card in player's hand
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) {
      response.message = 'Card not found in hand';
      return response;
    }
    
    const card = player.hand[cardIndex];
    
    // Check if player has enough energy
    if (player.energy < card.energyCost) {
      response.message = 'Not enough energy to play this card';
      return response;
    }
    
    // Play the card (remove from hand, add to field)
    player.hand.splice(cardIndex, 1);
    player.field.push({
      ...card,
      turnPlayed: game.currentTurn,
      canAttack: false, // Can't attack on the turn it's played
      abilityCooldowns: {},
      statusEffects: {}
    });
    
    // Deduct energy
    player.energy -= card.energyCost;
    
    // Add to game log
    game.logs.push({
      message: `${player.username} played ${card.name}`,
      timestamp: new Date()
    });
    
    // Save game
    game.markModified('players');
    game.markModified('logs');
    await game.save();
    
    // Check for win condition
    const gameResult = checkWinCondition(game);
    
    response.success = true;
    response.message = `Card played: ${card.name}`;
    response.gameStateChanged = true;
    response.gameState = getGameStateForPlayers(game);
    response.gameEnded = gameResult.gameEnded;
    response.winner = gameResult.winner;
    
    return response;
  } catch (error) {
    console.error('Error handling play card:', error);
    response.message = 'Error playing card';
    return response;
  }
};

// Handle using an ability
const handleUseAbility = async (game, playerId, sourceCardId, abilityId, targetCardId) => {
  const response = {
    success: false,
    message: '',
    gameStateChanged: false,
    gameEnded: false,
    winner: null,
    gameState: null
  };
  
  try {
    // Find player
    const playerIndex = game.players.findIndex(
      p => p.userId.toString() === playerId.toString()
    );
    
    if (playerIndex === -1) {
      response.message = 'Player not found in game';
      return response;
    }
    
    const player = game.players[playerIndex];
    const opponent = game.players.find(p => p.userId.toString() !== playerId.toString());
    
    if (!opponent) {
      response.message = 'Opponent not found';
      return response;
    }
    
    // Find source card on player's field
    const sourceCard = player.field.find(card => card.id === sourceCardId);
    if (!sourceCard) {
      response.message = 'Source card not found on field';
      return response;
    }
    
    // Find the ability
    const ability = sourceCard.abilities && sourceCard.abilities.find(a => a.id === abilityId);
    if (!ability) {
      response.message = 'Ability not found on card';
      return response;
    }
    
    // Check if ability is on cooldown
    if (sourceCard.abilityCooldowns && sourceCard.abilityCooldowns[abilityId] > 0) {
      response.message = 'Ability is on cooldown';
      return response;
    }
    
    // Check if player has enough energy
    if (player.energy < ability.energyCost) {
      response.message = 'Not enough energy to use this ability';
      return response;
    }
    
    // Handle different ability target types
    let targetCard = null;
    
    if (ability.targetType === 'self') {
      targetCard = sourceCard;
    } else if (ability.targetType === 'opponent' && targetCardId) {
      targetCard = opponent.field.find(card => card.id === targetCardId);
      if (!targetCard) {
        response.message = 'Target card not found';
        return response;
      }
    } else if (ability.targetType === 'all') {
      // Special handling for "all" target type
      response.message = 'All-target abilities not implemented yet';
      return response;
    }
    
    if (!targetCard && ability.targetType !== 'all') {
      response.message = 'No valid target for ability';
      return response;
    }
    
    // Deduct energy cost
    player.energy -= ability.energyCost;
    
    // Set ability on cooldown
    if (!sourceCard.abilityCooldowns) sourceCard.abilityCooldowns = {};
    sourceCard.abilityCooldowns[abilityId] = ability.cooldown;
    
    // Apply ability effect based on type
    // This is a simplified version - would need to be expanded for a real game
    if (ability.effectType === 'damage' && targetCard !== sourceCard) {
      // Apply damage to target
      if (!targetCard.currentStats) targetCard.currentStats = { ...targetCard.stats };
      
      const damage = ability.effectValue;
      targetCard.currentStats.health -= damage;
      
      // Add to game log
      game.logs.push({
        message: `${player.username}'s ${sourceCard.name} used ${ability.name} on ${targetCard.name} for ${damage} damage`,
        timestamp: new Date()
      });
      
      // Check if target is defeated
      if (targetCard.currentStats.health <= 0) {
        // Remove from field, add to discard pile
        const targetPlayer = targetCard === sourceCard ? player : opponent;
        const cardIndex = targetPlayer.field.findIndex(c => c.id === targetCard.id);
        
        if (cardIndex !== -1) {
          const removedCard = targetPlayer.field.splice(cardIndex, 1)[0];
          targetPlayer.discardPile.push(removedCard);
          
          // Add to game log
          game.logs.push({
            message: `${targetCard.name} was defeated!`,
            timestamp: new Date()
          });
        }
      }
    } else if (ability.effectType === 'heal') {
      // Apply healing to target
      if (!targetCard.currentStats) targetCard.currentStats = { ...targetCard.stats };
      
      const healAmount = ability.effectValue;
      const oldHealth = targetCard.currentStats.health;
      targetCard.currentStats.health = Math.min(
        targetCard.stats.health, // Max health
        targetCard.currentStats.health + healAmount
      );
      
      const actualHeal = targetCard.currentStats.health - oldHealth;
      
      // Add to game log
      game.logs.push({
        message: `${player.username}'s ${sourceCard.name} used ${ability.name} to heal ${targetCard.name} for ${actualHeal} health`,
        timestamp: new Date()
      });
    } else if (ability.effectType === 'buff') {
      // Apply buff to target
      if (!targetCard.currentStats) targetCard.currentStats = { ...targetCard.stats };
      
      targetCard.currentStats.attack += ability.effectValue;
      targetCard.currentStats.defense += ability.effectValue;
      
      // Add to game log
      game.logs.push({
        message: `${player.username}'s ${sourceCard.name} used ${ability.name} to buff ${targetCard.name} with +${ability.effectValue} attack and defense`,
        timestamp: new Date()
      });
    } else if (ability.effectType === 'debuff' && targetCard !== sourceCard) {
      // Apply debuff to target
      if (!targetCard.currentStats) targetCard.currentStats = { ...targetCard.stats };
      
      targetCard.currentStats.attack = Math.max(0, targetCard.currentStats.attack - ability.effectValue);
      targetCard.currentStats.defense = Math.max(0, targetCard.currentStats.defense - ability.effectValue);
      
      // Add to game log
      game.logs.push({
        message: `${player.username}'s ${sourceCard.name} used ${ability.name} to debuff ${targetCard.name} with -${ability.effectValue} attack and defense`,
        timestamp: new Date()
      });
    }
    
    // Save changes
    game.markModified('players');
    game.markModified('logs');
    await game.save();
    
    // Check for win condition
    const gameResult = checkWinCondition(game);
    
    response.success = true;
    response.message = `Used ability: ${ability.name}`;
    response.gameStateChanged = true;
    response.gameState = getGameStateForPlayers(game);
    response.gameEnded = gameResult.gameEnded;
    response.winner = gameResult.winner;
    
    return response;
  } catch (error) {
    console.error('Error handling use ability:', error);
    response.message = 'Error using ability';
    return response;
  }
};

// Handle end turn
const handleEndTurn = async (game, playerId) => {
  const response = {
    success: false,
    message: '',
    gameStateChanged: false,
    gameEnded: false,
    winner: null,
    gameState: null
  };
  
  try {
    // Validate it's the player's turn
    if (game.activePlayerId.toString() !== playerId.toString()) {
      response.message = 'Not your turn';
      return response;
    }
    
    // Find player and opponent indices
    const playerIndex = game.players.findIndex(
      p => p.userId.toString() === playerId.toString()
    );
    
    if (playerIndex === -1) {
      response.message = 'Player not found in game';
      return response;
    }
    
    // Get opponent (the next player)
    const opponentIndex = (playerIndex + 1) % game.players.length;
    
    // Switch active player
    game.activePlayerId = game.players[opponentIndex].userId;
    
    // If we completed a full round of turns, increment turn counter
    if (opponentIndex === 0) {
      game.currentTurn++;
    }
    
    // Reset cooldowns and update card statuses for active player's cards
    for (const card of game.players[playerIndex].field) {
      if (card.abilityCooldowns) {
        for (const abilityId in card.abilityCooldowns) {
          if (card.abilityCooldowns[abilityId] > 0) {
            card.abilityCooldowns[abilityId]--;
          }
        }
      }
    }
    
    // Restore some energy for the new active player
    game.players[opponentIndex].energy = Math.min(
      game.players[opponentIndex].maxEnergy,
      game.players[opponentIndex].energy + 2
    );
    
    // Draw a card for the new active player if they have cards left
    if (game.players[opponentIndex].deck.length > 0) {
      const drawnCard = game.players[opponentIndex].deck.shift();
      game.players[opponentIndex].hand.push(drawnCard);
      
      // Add to game log
      game.logs.push({
        message: `${game.players[opponentIndex].username} drew a card.`,
        timestamp: new Date()
      });
    }
    
    // Add to game log
    game.logs.push({
      message: `${game.players[playerIndex].username} ended their turn. ${game.players[opponentIndex].username}'s turn starts.`,
      timestamp: new Date()
    });
    
    // Save changes
    game.markModified('players');
    game.markModified('logs');
    await game.save();
    
    // Check for win condition
    const gameResult = checkWinCondition(game);
    
    response.success = true;
    response.message = 'Turn ended';
    response.gameStateChanged = true;
    response.gameState = getGameStateForPlayers(game);
    response.gameEnded = gameResult.gameEnded;
    response.winner = gameResult.winner;
    
    return response;
  } catch (error) {
    console.error('Error handling end turn:', error);
    response.message = 'Error ending turn';
    return response;
  }
};

// Check for win condition
const checkWinCondition = (game) => {
  const result = {
    gameEnded: false,
    winner: null
  };
  
  // If a player has no cards left in deck, hand, and field, they lose
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    const noCardsLeft = player.deck.length === 0 && player.hand.length === 0 && player.field.length === 0;
    
    if (noCardsLeft) {
      // This player has lost, so the other player is the winner
      const winnerIndex = (i + 1) % game.players.length;
      result.gameEnded = true;
      result.winner = game.players[winnerIndex].userId;
      break;
    }
  }
  
  return result;
};

export default setupSocketIO;
