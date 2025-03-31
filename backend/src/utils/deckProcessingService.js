/**
 * Deck Processing Service
 * 
 * Handles all deck-related operations, ensuring consistent format and reliable storage
 * in MongoDB regardless of input format. This service centralizes deck handling
 * to avoid redundancy and ensure consistent behavior.
 */

import mongoose from 'mongoose';
import { ensureProperDeckFormat } from './deckFormatter.js';

/**
 * Formats a deck to ensure all cards are valid, correctly typed objects
 * @param {Array|string|Object} rawDeck - Raw deck data that could be in various formats
 * @returns {Array} Properly formatted array of card objects ready for MongoDB storage
 */
export const formatDeck = (rawDeck) => {
  try {
    console.log(`[DeckProcessingService] Formatting deck...`);
    
    // Use our enhanced formatter that handles various formats
    const formattedDeck = ensureProperDeckFormat(rawDeck);
    
    if (!Array.isArray(formattedDeck) || formattedDeck.length === 0) {
      console.log("[DeckProcessingService] Formatting failed or returned empty deck");
      return [];
    }
    
    console.log(`[DeckProcessingService] Successfully formatted ${formattedDeck.length} cards`);
    return formattedDeck;
  } catch (error) {
    console.error("[DeckProcessingService] Error formatting deck:", error);
    return [];
  }
};

/**
 * Safely stores a deck for a player in a game using direct MongoDB operations
 * to bypass Mongoose validation issues
 * 
 * @param {string} gameId - MongoDB ObjectId of the game document
 * @param {number} playerIndex - Index of the player (0 or 1)
 * @param {Array|string|Object} deckData - Raw deck data to store
 * @returns {Promise<boolean>} Whether the operation was successful
 */
export const safelyStoreDeck = async (gameId, playerIndex, deckData) => {
  try {
    console.log(`[DeckProcessingService] Processing deck for game ${gameId}, player ${playerIndex + 1}`);

    // Format the deck data
    const processedDeck = formatDeck(deckData);
    
    if (!processedDeck.length) {
      console.log(`[DeckProcessingService] No valid cards to store`);
      return false;
    }
    
    // Make absolutely sure we have plain objects, not Mongoose documents
    const plainDeck = processedDeck.map(card => ({
      id: String(card.id || ''),
      name: String(card.name || 'Unknown Card'),
      skill: Number(card.skill || 10),
      stamina: Number(card.stamina || 10),
      aura: Number(card.aura || 10),
      baseTotal: Number(card.baseTotal || 30),
      finalTotal: Number(card.finalTotal || 30),
      rarity: String(card.rarity || 'common'),
      character: String(card.character || 'Unknown'),
      type: String(card.type || 'standard'),
      unlocked: Boolean(card.unlocked !== false)
    }));
    
    console.log(`[DeckProcessingService] Prepared ${plainDeck.length} cards for storage`);
    
    // Use direct MongoDB operation to update the player's deck
    // This avoids Mongoose validation and setter issues
    const result = await mongoose.connection.collection('veefriendsGames').updateOne(
      { _id: new mongoose.Types.ObjectId(gameId) },
      { $set: { [`players.${playerIndex}.deck`]: plainDeck } }
    );
    
    console.log(`[DeckProcessingService] MongoDB update result:`, result.modifiedCount > 0 ? 'Success' : 'No changes');
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error(`[DeckProcessingService] Error storing deck:`, error);
    return false;
  }
};

/**
 * Gets a player's deck from a game
 * @param {string} gameId - MongoDB ObjectId of the game document
 * @param {number} playerIndex - Index of the player (0 or 1)
 * @returns {Promise<Array>} The player's deck or empty array if not found
 */
export const getPlayerDeck = async (gameId, playerIndex) => {
  try {
    console.log(`[DeckProcessingService] Getting deck for game ${gameId}, player ${playerIndex + 1}`);
    
    const game = await mongoose.connection.collection('veefriendsGames').findOne(
      { _id: new mongoose.Types.ObjectId(gameId) }
    );
    
    if (!game || !game.players || !game.players[playerIndex]) {
      console.log(`[DeckProcessingService] Game or player not found`);
      return [];
    }
    
    const deck = game.players[playerIndex].deck;
    
    if (!Array.isArray(deck)) {
      console.log(`[DeckProcessingService] Player has no valid deck`);
      return [];
    }
    
    console.log(`[DeckProcessingService] Found deck with ${deck.length} cards`);
    return deck;
  } catch (error) {
    console.error(`[DeckProcessingService] Error getting deck:`, error);
    return [];
  }
};
