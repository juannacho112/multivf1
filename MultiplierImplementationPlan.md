# Multiplayer Card Game Implementation Plan

## Overview

This document outlines a plan to improve the reliability of the multiplayer card game implementation, focusing on making the emergency deck generation more robust while deferring full deck selection features to a future update.

## Current Issues

Based on analysis of the codebase and logs, we've identified several key issues:

1. **Deck Storage Issues**: Decks are not being properly stored in MongoDB, leading to validation errors and data loss
2. **Game State Synchronization**: When games are reloaded, decks show 0 cards despite being previously stored
3. **Card Display Problems**: The card UI components don't properly handle null or invalid card data
4. **Emergency Deck Generation**: The current emergency deck generation is working but needs to be more reliable

## Implementation Plan

### Phase 1: Improve MongoDB Deck Storage

#### 1.1 Enhance VeefriendsGame Schema

The current schema setter in `VeefriendsGame.js` has issues handling string data and JSON parsing. We'll improve it to:

```javascript
// Enhanced deck schema setter
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
        // More robust cleaning of string data
        const cleanedString = cards
          .replace(/\n/g, '')
          .replace(/\t/g, '')
          .replace(/\r/g, '')
          .replace(/\s+/g, ' ')
          .trim();
          
        // Better validation before parsing
        if (!cleanedString || cleanedString === '[]') {
          return [];
        }
        
        // Ensure the string looks like a JSON array
        if (!cleanedString.startsWith('[') || !cleanedString.endsWith(']')) {
          console.error("[VeefriendsGame] Invalid JSON array format in deck data");
          return [];
        }
        
        // Parse and validate
        const parsedCards = JSON.parse(cleanedString);
        if (!Array.isArray(parsedCards)) {
          return [];
        }
        
        // Ensure each card has the required fields with correct types
        return parsedCards.map(card => ({
          id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
          name: String(card.name || 'Card'),
          skill: Number(card.skill || 0),
          stamina: Number(card.stamina || 0),
          aura: Number(card.aura || 0),
          baseTotal: Number(card.baseTotal || 0),
          finalTotal: Number(card.finalTotal || 0),
          rarity: String(card.rarity || 'common'),
          character: String(card.character || 'Character'),
          type: String(card.type || 'standard'),
          unlocked: Boolean(card.unlocked !== false)
        }));
      } catch (e) {
        console.error("[VeefriendsGame] Error parsing cards string:", e);
        return [];
      }
    }
    
    // If already an array, validate the card format
    if (Array.isArray(cards)) {
      return cards.map(card => ({
        id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
        name: String(card.name || 'Card'),
        skill: Number(card.skill || 0),
        stamina: Number(card.stamina || 0),
        aura: Number(card.aura || 0),
        baseTotal: Number(card.baseTotal || 0),
        finalTotal: Number(card.finalTotal || 0),
        rarity: String(card.rarity || 'common'),
        character: String(card.character || 'Character'),
        type: String(card.type || 'standard'),
        unlocked: Boolean(card.unlocked !== false)
      }));
    }
    
    // For anything else, return empty array to avoid errors
    return [];
  }
}
```

#### 1.2 Improve Direct MongoDB Operations

Enhance the `deckStoreFix.js` utility to be more robust:

```javascript
export async function fixDeckStorage(db, gameId, playerIndex, deckData) {
  try {
    console.log(`[Emergency Fix] Storing deck for game ${gameId}, player ${playerIndex + 1}`);
    
    // Enhanced validation
    if (!db || !gameId || playerIndex === undefined || !deckData) {
      console.error('[Emergency Fix] Missing required parameters');
      return false;
    }
    
    // Ensure deck is an array with at least one card
    let deck = Array.isArray(deckData) ? deckData : [deckData];
    if (deck.length === 0) {
      console.error('[Emergency Fix] Empty deck data');
      return false;
    }
    
    // Convert to plain objects with proper types and validation
    const plainDeck = deck.map(card => ({
      id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      name: String(card.name || 'Fixed Card'),
      skill: Number(card.skill || 10),
      stamina: Number(card.stamina || 10), 
      aura: Number(card.aura || 10),
      baseTotal: Number(card.baseTotal || 30),
      finalTotal: Number(card.finalTotal || 30),
      rarity: String(card.rarity || 'common'),
      character: String(card.character || 'Fixed'),
      type: String(card.type || 'standard'),
      unlocked: true
    }));
    
    // Build update object for MongoDB
    const updateField = `players.${playerIndex}.deck`;
    const updateObj = { $set: { [updateField]: plainDeck } };
    
    // Try to convert string ID to ObjectId with better error handling
    let objectId;
    try {
      objectId = new ObjectId(gameId);
    } catch (e) {
      console.error('[Emergency Fix] Invalid ObjectId format:', e);
      return false;
    }

    // Direct MongoDB update with retry logic
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        const result = await db.collection('veefriendsGames').updateOne(
          { _id: objectId },
          updateObj
        );
        
        success = result.matchedCount > 0;
        
        console.log(`[Emergency Fix] Update attempt ${attempts} result:`, 
          success ? `Success - ${plainDeck.length} cards stored` : 'Failed - no matching document found'
        );
        
        if (success) break;
        
        // Short delay before retry
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        }
      } catch (error) {
        console.error(`[Emergency Fix] Error in attempt ${attempts}:`, error);
        // Delay before retry
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempts));
        }
      }
    }
    
    return success;
  } catch (error) {
    console.error('[Emergency Fix] Critical error storing deck:', error);
    return false;
  }
}
```

### Phase 2: Improve Game State Synchronization

#### 2.1 Enhance Game State Retrieval

Update the `getGameState` method in `VeefriendsGame.js` to include more complete deck data:

```javascript
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
      // Include first 5 cards of deck for UI preview
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
```

#### 2.2 Improve Game Reloading in Socket Service

Enhance the game reloading logic in `veefriendsSocketService.js`:

```javascript
// Ensure the game is properly refreshed after all deck updates
console.log(`Reloading game ${gameId} to ensure latest deck data is available`);

// Use findById with lean option for better performance
let game = await VeefriendsGame.findById(gameId).lean();

if (!game) {
  console.error(`Game ${gameId} not found after deck setup`);
  throw new Error(`Game ${gameId} not found after deck setup`);
}

// Verify deck data integrity
const player1DeckLength = Array.isArray(game.players[0]?.deck) ? game.players[0].deck.length : 0;
const player2DeckLength = Array.isArray(game.players[1]?.deck) ? game.players[1].deck.length : 0;

console.log(`Player 1 deck has ${player1DeckLength} cards after reload`);
console.log(`Player 2 deck has ${player2DeckLength} cards after reload`);

// If decks are missing, try one more reload with a slight delay
if (player1DeckLength === 0 || player2DeckLength === 0) {
  console.log("Deck data missing, attempting secondary reload after delay");
  await new Promise(resolve => setTimeout(resolve, 100));
  game = await VeefriendsGame.findById(gameId);
}
```

### Phase 3: Improve Emergency Deck Generation

#### 3.1 Enhance Card Generation Utility

Improve the card generation utility in `cardUtils.js`:

```javascript
// Enhanced random deck generation with better error handling
export function generateRandomDeck(cardPool, deckSize = 20) {
  try {
    // Validate inputs
    if (!Array.isArray(cardPool) || cardPool.length === 0) {
      console.error("Invalid card pool for deck generation");
      return getEmergencyDeck(deckSize);
    }
    
    if (!deckSize || deckSize <= 0) {
      deckSize = 20; // Default to 20 cards
    }
    
    // Ensure we don't try to get more cards than available
    const availableCards = cardPool.filter(card => card && typeof card === 'object');
    const actualDeckSize = Math.min(deckSize, availableCards.length);
    
    if (actualDeckSize === 0) {
      console.error("No valid cards in pool for deck generation");
      return getEmergencyDeck(deckSize);
    }
    
    // Shuffle the card pool
    const shuffled = [...availableCards].sort(() => 0.5 - Math.random());
    
    // Take the first N cards
    const selectedCards = shuffled.slice(0, actualDeckSize);
    
    // Ensure each card has required properties
    return selectedCards.map(card => ({
      id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      name: String(card.name || 'Random Card'),
      skill: Number(card.skill || Math.floor(Math.random() * 10) + 1),
      stamina: Number(card.stamina || Math.floor(Math.random() * 10) + 1),
      aura: Number(card.aura || Math.floor(Math.random() * 10) + 1),
      baseTotal: Number(card.baseTotal || 0),
      finalTotal: Number(card.finalTotal || 0),
      rarity: String(card.rarity || 'common'),
      character: String(card.character || `Character_${Math.floor(Math.random() * 1000)}`),
      type: String(card.type || 'standard'),
      unlocked: true
    }));
  } catch (error) {
    console.error("Error generating random deck:", error);
    return getEmergencyDeck(deckSize);
  }
}

// Fallback emergency deck generation
export function getEmergencyDeck(size = 20) {
  console.log(`Generating emergency deck with ${size} cards`);
  
  const emergencyDeck = [];
  
  // Generate cards with varied attributes for better gameplay
  for (let i = 0; i < size; i++) {
    // Create some variety in the emergency cards
    const skill = Math.floor(Math.random() * 10) + 1;
    const stamina = Math.floor(Math.random() * 10) + 1;
    const aura = Math.floor(Math.random() * 10) + 1;
    const total = skill + stamina + aura;
    
    emergencyDeck.push({
      id: `emergency-${Date.now()}-${i}`,
      name: `Emergency Card ${i+1}`,
      skill,
      stamina,
      aura,
      baseTotal: total,
      finalTotal: total,
      rarity: i % 5 === 0 ? 'rare' : 'common', // Some variety in rarity
      character: `Emergency_${i+1}`,
      type: 'standard',
      unlocked: true
    });
  }
  
  return emergencyDeck;
}
```

#### 3.2 Improve Emergency Deck Application

Enhance the emergency deck application in `veefriendsSocketService.js`:

```javascript
// Improved emergency deck generation and application
if (player1DeckLength === 0 || player2DeckLength === 0) {
  console.log("Attempting emergency deck generation directly in MongoDB");
  
  try {
    const { generateRandomDeck, fullCardPool, getEmergencyDeck } = await import('../utils/cardUtils.js');
    
    // Try to generate a proper deck first
    let emergencyDeck;
    try {
      emergencyDeck = generateRandomDeck(fullCardPool, 20);
      console.log(`Generated emergency deck with ${emergencyDeck.length} cards`);
    } catch (genError) {
      console.error('Error generating random deck:', genError);
      // Fallback to simple emergency deck
      emergencyDeck = getEmergencyDeck(20);
    }
    
    // Apply to both players if needed
    const db = getMongoDb(mongoose);
    let emergencyFixApplied = false;
    
    if (db) {
      // Apply to player 1 if needed
      if (player1DeckLength === 0) {
        const success = await fixDeckStorage(db, gameId.toString(), 0, emergencyDeck);
        console.log(`Applied emergency deck to player 1: ${success ? 'Success' : 'Failed'}`);
        emergencyFixApplied = emergencyFixApplied || success;
      }
      
      // Apply to player 2 if needed
      if (player2DeckLength === 0) {
        const success = await fixDeckStorage(db, gameId.toString(), 1, emergencyDeck);
        console.log(`Applied emergency deck to player 2: ${success ? 'Success' : 'Failed'}`);
        emergencyFixApplied = emergencyFixApplied || success;
      }
      
      // Reload the game again after emergency fix
      if (emergencyFixApplied) {
        // Short delay to ensure database writes complete
        await new Promise(resolve => setTimeout(resolve, 100));
        game = await VeefriendsGame.findById(gameId);
        console.log("Game reloaded after emergency fix");
      }
    } else {
      console.error('Failed to get MongoDB connection for emergency fix');
    }
  } catch (emergencyError) {
    console.error("Emergency deck generation failed:", emergencyError);
  }
}
```

### Phase 4: Improve Card UI Components

#### 4.1 Enhance EnhancedFlippableCard Component

Update the `EnhancedFlippableCard.tsx` component to better handle null or invalid card data:

```typescript
const renderCardFront = () => {
  // Debug logging to help identify issues with card data
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[EnhancedFlippableCard] Rendering card:`, card ? 
      `${card.name} (${card.id})` : 'null/undefined');
  }
  
  if (!card) {
    // Show empty card design for missing cards
    return (
      <View style={[styles.cardSide, styles.cardFront, { backgroundColor: colors.background, borderColor: colors.tint }]}>
        <ThemedText type="subtitle" style={styles.emptyCardText}>Waiting...</ThemedText>
      </View>
    );
  }

  // Additional validation to handle malformed card data
  const isValidCard = card && 
    typeof card === 'object' && 
    'name' in card && 
    'skill' in card && 
    'stamina' in card && 
    'aura' in card;

  if (!isValidCard) {
    console.error('[EnhancedFlippableCard] Invalid card data:', card);
    return (
      <View style={[styles.cardSide, styles.cardFront, { backgroundColor: colors.background, borderColor: colors.tint }]}>
        <ThemedText type="subtitle" style={styles.emptyCardText}>Invalid Card</ThemedText>
      </View>
    );
  }
  
  // Proceed with normal card rendering for valid cards
  // ...
}
```

#### 4.2 Improve OnlineBattleScreen Component

Enhance the `OnlineBattleScreen.tsx` component to better handle game state:

```typescript
// Debug game state
if (process.env.NODE_ENV !== 'production') {
  console.log(`[OnlineBattleScreen] Current game state:`, {
    phase: activeGame?.phase,
    cardsInPlay: JSON.stringify(activeGame?.cardsInPlay || {}),
    player1Cards: activeGame?.players?.[0]?.deck?.length || 0,
    player2Cards: activeGame?.players?.[1]?.deck?.length || 0
  });
}

// Ensure cardsInPlay has valid structure
const cardsInPlay = activeGame?.cardsInPlay || { player1: null, player2: null };

// Validate card data before rendering
const player1Card = cardsInPlay.player1 && typeof cardsInPlay.player1 === 'object' ? cardsInPlay.player1 : null;
const player2Card = cardsInPlay.player2 && typeof cardsInPlay.player2 === 'object' ? cardsInPlay.player2 : null;
```

## Future Enhancements (For Later Updates)

1. **Full Deck Selection Feature**:
   - Create a deck selection UI before entering multiplayer games
   - Implement API endpoints for uploading deck data to the server
   - Add validation to ensure decks meet multiplayer requirements

2. **Persistent Deck Storage**:
   - Store user decks in the database for multiplayer use
   - Implement synchronization between local and server decks

3. **Enhanced Card UI**:
   - Improve card animations and visual effects
   - Add card collection and deck building features specific to multiplayer

4. **Game State Persistence**:
   - Implement game state saving for disconnection recovery
   - Add replay functionality for completed games