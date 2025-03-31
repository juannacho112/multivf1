/**
 * Database cleanup utility for VeeFriends multiplayer
 * Fixes deck data issues from MongoDB validation errors
 */

import mongoose from 'mongoose';
import VeefriendsGame from './src/models/VeefriendsGame.js';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

/**
 * Clean up deck data in games collection
 */
async function cleanupDeckData() {
  try {
    // Find games that might have issues
    const games = await VeefriendsGame.find();
    console.log(`Found ${games.length} games to check`);
    
    let fixedGames = 0;
    
    // Process each game
    for (const game of games) {
      let gameWasFixed = false;
      
      // Check and fix players' deck data
      for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        
        // Check if deck needs fixing
        if (player.deck) {
          let needsFixing = false;
          
          if (typeof player.deck === 'string') {
            console.log(`Game ${game._id}: Player ${i+1} has string deck, needs fixing`);
            needsFixing = true;
          } else if (Array.isArray(player.deck) && player.deck.length > 0) {
            // Check if any card in the array is a string or has missing properties
            for (const card of player.deck) {
              if (typeof card === 'string' || typeof card !== 'object' || card === null || 
                  !card.id || !card.name || typeof card.skill !== 'number') {
                console.log(`Game ${game._id}: Player ${i+1} has malformed deck cards, needs fixing`);
                needsFixing = true;
                break;
              }
            }
          }
          
          // Fix deck if needed
          if (needsFixing) {
            try {
              // Get deck data in its current format
              const rawDeck = player.deck;
              
              // Use our formatter to ensure proper structure
              const formattedDeck = ensureProperDeckFormat(rawDeck);
              
              if (Array.isArray(formattedDeck) && formattedDeck.length > 0) {
                // Explicitly create array of plain objects (not Mongoose documents)
                const cleanDeck = formattedDeck.map(card => ({
                  id: String(card.id),
                  name: String(card.name),
                  skill: Number(card.skill),
                  stamina: Number(card.stamina),
                  aura: Number(card.aura),
                  baseTotal: Number(card.baseTotal || 0),
                  finalTotal: Number(card.finalTotal || 0),
                  rarity: String(card.rarity || 'common'),
                  character: String(card.character || ''),
                  type: String(card.type || 'standard'),
                  unlocked: Boolean(card.unlocked !== false)
                }));
                
                // Update directly in MongoDB to bypass Mongoose validation
                await mongoose.connection.collection('veefriendsGames').updateOne(
                  { _id: game._id, 'players._id': player._id },
                  { $set: { [`players.${i}.deck`]: cleanDeck } }
                );
                
                console.log(`Game ${game._id}: Fixed Player ${i+1}'s deck (${cleanDeck.length} cards)`);
                gameWasFixed = true;
              } else {
                console.log(`Game ${game._id}: Could not format Player ${i+1}'s deck, setting to empty`);
                
                // Last resort - set empty deck
                await mongoose.connection.collection('veefriendsGames').updateOne(
                  { _id: game._id, 'players._id': player._id },
                  { $set: { [`players.${i}.deck`]: [] } }
                );
                
                gameWasFixed = true;
              }
            } catch (error) {
              console.error(`Game ${game._id}: Error fixing Player ${i+1}'s deck:`, error);
            }
          }
        }
      }
      
      if (gameWasFixed) {
        fixedGames++;
      }
    }
    
    console.log(`Fixed ${fixedGames} games with deck data issues`);
  } catch (error) {
    console.error('Error cleaning up deck data:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup
cleanupDeckData();
