/**
 * Emergency Deck Storage Fix
 * 
 * This is a simplified utility for fixing VeeFriends deck storage issues.
 * It bypasses Mongoose and directly interacts with MongoDB to store
 * deck data safely without validation errors.
 */

import { ObjectId } from 'mongodb';

/**
 * Simplest possible function to fix deck storage issues
 * This uses direct MongoDB operations to bypass any Mongoose issues
 * 
 * @param {object} db - MongoDB connection/database instance
 * @param {string} gameId - ID of the game to update
 * @param {number} playerIndex - 0 for player1, 1 for player2
 * @param {Array|Object} deckData - Deck data to store 
 * @returns {Promise<boolean>} Success result
 */
export async function fixDeckStorage(db, gameId, playerIndex, deckData) {
  try {
    console.log(`[Emergency Fix] Storing deck for game ${gameId}, player ${playerIndex + 1}`);
    
    // Simple validation
    if (!db || !gameId || playerIndex === undefined || !deckData) {
      console.error('[Emergency Fix] Missing required parameters');
      return false;
    }
    
    // Ensure deck is an array
    let deck = Array.isArray(deckData) ? deckData : [deckData];
    
    // Convert to plain objects with proper types
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
    
    // Try to convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(gameId);
    } catch (e) {
      console.error('[Emergency Fix] Invalid ObjectId format:', e);
      return false;
    }

    // Direct MongoDB update
    const result = await db.collection('veefriendsGames').updateOne(
      { _id: objectId },
      updateObj
    );
    
    console.log(`[Emergency Fix] Update result:`, result.matchedCount > 0 
      ? `Success - ${plainDeck.length} cards stored` 
      : 'Failed - no matching document found'
    );
    
    return result.matchedCount > 0;
  } catch (error) {
    console.error('[Emergency Fix] Error storing deck:', error);
    return false;
  }
}

/**
 * Get MongoDB connection from Mongoose connection
 */
export function getMongoDb(mongoose) {
  if (!mongoose || !mongoose.connection || !mongoose.connection.db) {
    console.error('[Emergency Fix] No valid Mongoose connection');
    return null;
  }
  return mongoose.connection.db;
}
