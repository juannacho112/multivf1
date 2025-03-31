import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Card schema
const CardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  skill: {
    type: Number,
    required: true
  },
  stamina: {
    type: Number,
    required: true
  },
  aura: {
    type: Number,
    required: true
  },
  baseTotal: {
    type: Number,
    required: true
  },
  finalTotal: {
    type: Number,
    required: true
  },
  rarity: {
    type: String,
    required: true
  },
  character: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  unlocked: {
    type: Boolean,
    default: true
  }
});

// Points schema
const PointsSchema = new mongoose.Schema({
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
});

// Player schema
const PlayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isGuest; } // Only required if not a guest
  },
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  isReady: {
    type: Boolean,
    default: false
  },
  deck: {
    type: [],
    default: [],
    set: function(cards) {
      // If the cards are passed as a stringified array, parse it
      if (typeof cards === 'string') {
        try {
          // Clean up newlines and whitespace that cause MongoDB validation issues
          const cleanedString = cards.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
          
          // Handle JS string concatenation pattern in the error
          if (cleanedString.includes("' +")) {
            return []; // Return empty array if we detect concatenation strings
          }
          
          // Parse the cleaned string
          return JSON.parse(cleanedString);
        } catch (e) {
          console.error("Error parsing cards string:", e);
          return [];
        }
      }
      
      // If already an array, just return it
      if (Array.isArray(cards)) {
        return cards;
      }
      
      // For anything else, return empty array to avoid errors
      console.error("Unexpected deck data type:", typeof cards);
      return [];
    }
  },
  points: {
    type: PointsSchema,
    default: {
      skill: 0,
      stamina: 0,
      aura: 0
    }
  },
  terrificTokenUsed: {
    type: Boolean,
    default: false
  }
});

// VeeFriends Game schema
const VeefriendsGameSchema = new mongoose.Schema({
  gameCode: {
    type: String,
    required: true,
    unique: true,
    default: () => {
      // Generate 6-character alphanumeric code
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  },
  players: {
    type: [PlayerSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting'
  },
  phase: {
    type: String,
    enum: ['draw', 'challengerPick', 'acceptDeny', 'resolve', 'gameOver'],
    default: 'draw'
  },
  cardsInPlay: {
    type: Object,
    default: {
      player1: null,
      player2: null
    }
  },
  roundNumber: {
    type: Number,
    default: 1
  },
  potSize: {
    type: Number,
    default: 1
  },
  burnPile: {
    type: Array,
    default: []
  },
  winner: {
    type: String,
    enum: ['player1', 'player2', null],
    default: null
  },
  currentChallenger: {
    type: String,
    enum: ['player1', 'player2', null],
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
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
VeefriendsGameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a player to the game
VeefriendsGameSchema.methods.addPlayer = async function(user, isGuest = false) {
  if (this.players.length >= 2) {
    throw new Error('Game already has maximum players');
  }
  
  if (this.status !== 'waiting') {
    throw new Error('Game already started');
  }
  
  this.players.push({
    userId: isGuest ? null : user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    isGuest,
    isReady: false,
    deck: [],
    points: {
      skill: 0,
      stamina: 0,
      aura: 0
    },
    terrificTokenUsed: false
  });
  
  return this.save();
};

// Method to check if all players are ready
VeefriendsGameSchema.methods.isReadyToStart = function() {
  return this.players.length === 2 && this.players.every(p => p.isReady);
};

// Method to get formatted game state for sending to clients
VeefriendsGameSchema.methods.getGameState = function() {
  // Return a cleaned up version of the game state
  return {
    id: this._id,
    gameCode: this.gameCode,
    status: this.status,
    phase: this.phase,
    players: this.players.map(player => ({
      userId: player.userId,
      username: player.username,
      displayName: player.displayName,
      isGuest: player.isGuest,
      isReady: player.isReady,
      deckSize: Array.isArray(player.deck) ? player.deck.length : 0,
      points: player.points,
      terrificTokenUsed: player.terrificTokenUsed
    })),
    cardsInPlay: this.cardsInPlay,
    roundNumber: this.roundNumber,
    potSize: this.potSize,
    currentChallenger: this.currentChallenger,
    challengeAttribute: this.challengeAttribute,
    deniedAttributes: this.deniedAttributes,
    availableAttributes: this.availableAttributes,
    winner: this.winner
  };
};

// Create model from schema
const VeefriendsGame = mongoose.model('VeefriendsGame', VeefriendsGameSchema, 'veefriendsGames');

export default VeefriendsGame;
