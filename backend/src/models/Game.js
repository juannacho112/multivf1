import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const gameSchema = new mongoose.Schema({
  gameCode: {
    type: String,
    required: true,
    unique: true,
    default: () => {
      // Generate a short, readable game code (6 characters)
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    }
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting'
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    displayName: String,
    isReady: {
      type: Boolean,
      default: false
    },
    deck: [{
      type: Object // Store card objects directly
    }],
    hand: [{
      type: Object
    }],
    field: [{
      type: Object
    }],
    discardPile: [{
      type: Object
    }],
    energy: {
      type: Number,
      default: 3
    },
    maxEnergy: {
      type: Number,
      default: 3
    }
  }],
  activePlayerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentTurn: {
    type: Number,
    default: 0
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  gameState: {
    type: Object,
    default: {}
  },
  logs: [{
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for looking up games by code
gameSchema.index({ gameCode: 1 });
// Index for finding active games
gameSchema.index({ status: 1 });
// Index for recent games
gameSchema.index({ lastActivity: -1 });

// Helper method to add a player to the game
gameSchema.methods.addPlayer = function(user) {
  // Check if game is full
  if (this.players.length >= 2) {
    throw new Error('Game is full');
  }
  
  // Check if player is already in game
  const existingPlayer = this.players.find(p => 
    p.userId.toString() === user._id.toString()
  );
  
  if (existingPlayer) {
    throw new Error('Player is already in the game');
  }
  
  // Add the player
  this.players.push({
    userId: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    isReady: false
  });
  
  // If this is the second player joining, set game status to active
  if (this.players.length === 2) {
    this.status = 'active';
  }
  
  return this;
};

// Helper method to check if game is ready to start
gameSchema.methods.isReadyToStart = function() {
  if (this.players.length !== 2) return false;
  
  return this.players.every(player => player.isReady);
};

// Helper method to get game summary (public data)
gameSchema.methods.getGameSummary = function() {
  return {
    id: this._id,
    gameCode: this.gameCode,
    status: this.status,
    players: this.players.map(player => ({
      userId: player.userId,
      username: player.username,
      displayName: player.displayName,
      isReady: player.isReady
    })),
    currentTurn: this.currentTurn,
    isPrivate: this.isPrivate,
    createdAt: this.createdAt,
    lastActivity: this.lastActivity
  };
};

// Create model
const Game = mongoose.model('Game', gameSchema);

export default Game;
