import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const veefriendsGameSchema = new mongoose.Schema({
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
      ref: 'User'
    },
    username: String,
    displayName: String,
    isReady: {
      type: Boolean,
      default: false
    },
    isGuest: {
      type: Boolean,
      default: false
    },
    deck: {
      type: [{
        id: String,
        name: String,
        skill: Number,
        stamina: Number,
        aura: Number,
        baseTotal: Number,
        finalTotal: Number,
        rarity: String,
        character: String,
        type: String,
        unlocked: Boolean
      }],
      default: [],
      // Ensure card objects can be stored properly even if they're JSON strings first
      set: function(cards) {
        // If the cards are passed as a stringified array, parse it
        if (typeof cards === 'string') {
          try {
            return JSON.parse(cards);
          } catch (e) {
            console.error("Error parsing cards:", e);
            return [];
          }
        }
        return cards;
      }
    },
    points: {
      skill: {
        type: Number,
        default: 0
      },
      stamina: {
        type: Number,
        default: 0
      },
      aura: {
        type: Number,
        default: 0
      }
    },
    terrificTokenUsed: {
      type: Boolean,
      default: false
    }
  }],
  // Cards in play
  cardsInPlay: {
    player1: {
      type: Object,
      default: null
    },
    player2: {
      type: Object,
      default: null
    }
  },
  // Game state
  phase: {
    type: String,
    enum: ['draw', 'challengerPick', 'acceptDeny', 'resolve', 'gameOver'],
    default: 'draw'
  },
  currentChallenger: {
    type: String,
    enum: ['player1', 'player2'],
    default: 'player1'
  },
  challengeAttribute: {
    type: String,
    enum: ['skill', 'stamina', 'aura', 'total', null],
    default: null
  },
  deniedAttributes: {
    type: [String],
    default: []
  },
  availableAttributes: {
    type: [String],
    default: ['skill', 'stamina', 'aura']
  },
  burnPile: {
    type: [Object],
    default: []
  },
  roundNumber: {
    type: Number,
    default: 1
  },
  potSize: {
    type: Number,
    default: 1
  },
  winner: {
    type: String,
    enum: ['player1', 'player2', null],
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: false
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
veefriendsGameSchema.index({ gameCode: 1 });
// Index for finding active games
veefriendsGameSchema.index({ status: 1 });
// Index for recent games
veefriendsGameSchema.index({ lastActivity: -1 });

// Helper method to add a player to the game
veefriendsGameSchema.methods.addPlayer = function(user, isGuest = false) {
  // Check if game is full
  if (this.players.length >= 2) {
    throw new Error('Game is full');
  }
  
  // Check if player is already in game
  const existingPlayer = this.players.find(p => 
    user._id && p.userId && p.userId.toString() === user._id.toString()
  );
  
  if (existingPlayer) {
    throw new Error('Player is already in the game');
  }

  // Generate player data
  const playerData = {
    userId: isGuest ? null : user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    isReady: false,
    isGuest: isGuest,
    deck: [],
    points: {
      skill: 0,
      stamina: 0,
      aura: 0
    },
    terrificTokenUsed: false
  };
  
  // Add the player
  this.players.push(playerData);
  
  return this;
};

// Helper method to check if game is ready to start
veefriendsGameSchema.methods.isReadyToStart = function() {
  if (this.players.length !== 2) return false;
  
  return this.players.every(player => player.isReady);
};

// Helper method to get game summary (public data)
veefriendsGameSchema.methods.getGameSummary = function() {
  return {
    id: this._id,
    gameCode: this.gameCode,
    status: this.status,
    phase: this.phase,
    currentChallenger: this.currentChallenger,
    challengeAttribute: this.challengeAttribute,
    roundNumber: this.roundNumber,
    potSize: this.potSize,
    players: this.players.map(player => ({
      userId: player.userId,
      username: player.username,
      displayName: player.displayName,
      isReady: player.isReady,
      isGuest: player.isGuest,
      points: player.points,
      terrificTokenUsed: player.terrificTokenUsed,
      deckCount: player.deck.length
    })),
    winner: this.winner,
    isPrivate: this.isPrivate,
    createdAt: this.createdAt,
    lastActivity: this.lastActivity
  };
};

// Helper method to get the full game state for players
veefriendsGameSchema.methods.getGameState = function() {
  return {
    id: this._id,
    gameCode: this.gameCode,
    status: this.status,
    phase: this.phase,
    currentChallenger: this.currentChallenger,
    challengeAttribute: this.challengeAttribute,
    deniedAttributes: this.deniedAttributes,
    availableAttributes: this.availableAttributes,
    cardsInPlay: this.cardsInPlay,
    burnPile: this.burnPile,
    roundNumber: this.roundNumber,
    potSize: this.potSize,
    players: this.players.map(player => ({
      userId: player.userId,
      username: player.username,
      displayName: player.displayName,
      isReady: player.isReady,
      isGuest: player.isGuest,
      points: player.points,
      terrificTokenUsed: player.terrificTokenUsed,
      deckCount: player.deck.length
    })),
    winner: this.winner
  };
};

// Create model
const VeefriendsGame = mongoose.model('VeefriendsGame', veefriendsGameSchema);

export default VeefriendsGame;
