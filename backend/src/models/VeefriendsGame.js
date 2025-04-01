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
    set: function(cards) {
      // If the cards are passed as a stringified array, parse it
      if (typeof cards === 'string') {
        try {
          console.log(`[VeefriendsGame] Received deck as string, length: ${cards.length}`);
          
          // Handle empty string
          if (!cards.trim()) {
            console.log('[VeefriendsGame] Empty string deck, returning empty array');
            return [];
          }
          
          // More robust cleaning of string data
          let cleanedString = cards
            .replace(/\n/g, '')
            .replace(/\t/g, '')
            .replace(/\r/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Handle JS string concatenation patterns in the error
          if (cleanedString.includes("' +") || cleanedString.includes("'+") || 
              cleanedString.includes("[\n") || cleanedString.includes("\n]")) {
            console.error("[VeefriendsGame] Detected string concatenation or newlines in deck data");
            // Try to fix the string by removing all quotes and newlines
            cleanedString = cleanedString.replace(/['"\n\r]/g, "").replace(/\s+/g, " ").trim();
            // Add back the proper brackets and rebuild the string
            if (!cleanedString.startsWith('[')) cleanedString = '[' + cleanedString;
            if (!cleanedString.endsWith(']')) cleanedString = cleanedString + ']';
          }
          
          // Better validation before parsing
          if (!cleanedString || cleanedString === '[]') {
            console.log('[VeefriendsGame] Empty JSON array, returning empty array');
            return [];
          }
          
          // Ensure the string looks like a JSON array
          if (!cleanedString.startsWith('[') || !cleanedString.endsWith(']')) {
            console.error("[VeefriendsGame] Invalid JSON array format in deck data");
            return [];
          }
          
          // Try to parse with additional error handling
          let parsedCards;
          try {
            parsedCards = JSON.parse(cleanedString);
          } catch (parseError) {
            console.error("[VeefriendsGame] JSON parse error:", parseError.message);
            
            // Try to fix common JSON issues
            try {
              // Replace single quotes with double quotes (common error)
              const fixedString = cleanedString.replace(/'/g, '"');
              parsedCards = JSON.parse(fixedString);
              console.log("[VeefriendsGame] Successfully parsed after fixing quotes");
            } catch (secondError) {
              console.error("[VeefriendsGame] Failed to parse even after fixing quotes");
              return [];
            }
          }
          
          // Validate that we got an array of cards with required fields
          if (!Array.isArray(parsedCards)) {
            console.error("[VeefriendsGame] Parsed result is not an array:", typeof parsedCards);
            return [];
          }
          
          // Filter out any non-object items
          const filteredCards = parsedCards.filter(card => card && typeof card === 'object');
          if (filteredCards.length < parsedCards.length) {
            console.warn(`[VeefriendsGame] Filtered out ${parsedCards.length - filteredCards.length} invalid cards`);
          }
          
          // Ensure each card has the required fields with correct types
          const validatedCards = filteredCards.map(card => ({
            id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
            name: String(card.name || 'Card'),
            skill: Number(isNaN(card.skill) ? 0 : card.skill),
            stamina: Number(isNaN(card.stamina) ? 0 : card.stamina),
            aura: Number(isNaN(card.aura) ? 0 : card.aura),
            baseTotal: Number(isNaN(card.baseTotal) ? 0 : card.baseTotal),
            finalTotal: Number(isNaN(card.finalTotal) ? 0 : card.finalTotal),
            rarity: String(card.rarity || 'common'),
            character: String(card.character || 'Character'),
            type: String(card.type || 'standard'),
            unlocked: Boolean(card.unlocked !== false) // Default to true if not explicitly false
          }));
          
          console.log(`[VeefriendsGame] Successfully parsed ${validatedCards.length} cards from string`);
          return validatedCards;
        } catch (e) {
          console.error("[VeefriendsGame] Critical error parsing cards string:", e);
          // Return empty array as last resort
          return [];
        }
      }
      
      // If already an array, validate the card format
      if (Array.isArray(cards)) {
        // Filter out any non-object items
        const filteredCards = cards.filter(card => card && typeof card === 'object');
        if (filteredCards.length < cards.length) {
          console.warn(`[VeefriendsGame] Filtered out ${cards.length - filteredCards.length} invalid cards from array`);
        }
        
        // Ensure each card has the required fields with correct types
        const validatedCards = filteredCards.map(card => ({
          id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
          name: String(card.name || 'Card'),
          skill: Number(isNaN(card.skill) ? 0 : card.skill),
          stamina: Number(isNaN(card.stamina) ? 0 : card.stamina),
          aura: Number(isNaN(card.aura) ? 0 : card.aura),
          baseTotal: Number(isNaN(card.baseTotal) ? 0 : card.baseTotal),
          finalTotal: Number(isNaN(card.finalTotal) ? 0 : card.finalTotal),
          rarity: String(card.rarity || 'common'),
          character: String(card.character || 'Character'),
          type: String(card.type || 'standard'),
          unlocked: Boolean(card.unlocked !== false) // Default to true if not explicitly false
        }));
        
        return validatedCards;
      }
      
      // For anything else, return empty array to avoid errors
      console.error("[VeefriendsGame] Unexpected deck data type:", typeof cards);
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
      // Include first 5 cards of deck for UI preview (do not send the entire deck for performance)
      deck: Array.isArray(player.deck) ? player.deck.slice(0, 5) : [],
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
