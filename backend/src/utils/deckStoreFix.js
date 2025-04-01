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
    
    // Filter out any invalid cards
    deck = deck.filter(card => card && typeof card === 'object');
    if (deck.length === 0) {
      console.error('[Emergency Fix] No valid cards in deck data');
      return false;
    }
    
    // Convert to plain objects with proper types and validation
    const plainDeck = deck.map(card => ({
      id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
      name: String(card.name || 'Fixed Card'),
      skill: Number(isNaN(card.skill) ? 10 : card.skill),
      stamina: Number(isNaN(card.stamina) ? 10 : card.stamina),
      aura: Number(isNaN(card.aura) ? 10 : card.aura),
      baseTotal: Number(isNaN(card.baseTotal) ? 30 : card.baseTotal),
      finalTotal: Number(isNaN(card.finalTotal) ? 30 : card.finalTotal),
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
