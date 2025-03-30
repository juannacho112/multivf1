/**
 * MongoDB cleanup script for VeeFriends games with malformed deck data
 * Run with: node cleanup-db.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';

// Load environment variables
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import VeefriendsGame model
import VeefriendsGame from './src/models/VeefriendsGame.js';

async function cleanup() {
  try {
    console.log('Starting VeeFriends games cleanup...');
    
    // Find all games
    const games = await VeefriendsGame.find({});
    console.log(`Found ${games.length} games to process`);
    
    let fixedGames = 0;
    let skippedGames = 0;
    let errorGames = 0;
    
    // Process each game
    for (const game of games) {
      try {
        let gameFixed = false;
        
        // Check and fix each player's deck
        for (let i = 0; i < game.players.length; i++) {
          const player = game.players[i];
          
          if (!player.deck) {
            console.log(`Game ${game._id}: Player ${i+1} has no deck, initializing empty array`);
            await VeefriendsGame.updateOne(
              { _id: game._id },
              { $set: { [`players.${i}.deck`]: [] } }
            );
            gameFixed = true;
            continue;
          }
          
          // Check if deck is a string instead of array
          if (typeof player.deck === 'string') {
            console.log(`Game ${game._id}: Player ${i+1} has deck as string, fixing...`);
            
            try {
              // Clean up and parse the deck
              const cleanedString = player.deck.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
              const formattedDeck = ensureProperDeckFormat(cleanedString);
              
              // Update with properly formatted deck
              await VeefriendsGame.updateOne(
                { _id: game._id },
                { $set: { [`players.${i}.deck`]: formattedDeck } }
              );
              
              console.log(`Game ${game._id}: Player ${i+1} deck fixed (${formattedDeck.length} cards)`);
              gameFixed = true;
            } catch (deckError) {
              console.error(`Error fixing deck for game ${game._id}, player ${i+1}:`, deckError);
              
              // Reset to empty deck as last resort
              await VeefriendsGame.updateOne(
                { _id: game._id },
                { $set: { [`players.${i}.deck`]: [] } }
              );
              console.log(`Game ${game._id}: Player ${i+1} deck reset to empty array`);
              gameFixed = true;
            }
          } else if (Array.isArray(player.deck)) {
            // Check if array contains valid card objects
            let needsFormatting = false;
            
            for (const card of player.deck) {
              if (!card || typeof card !== 'object' || !card.id || typeof card.skill !== 'number') {
                needsFormatting = true;
                break;
              }
            }
            
            if (needsFormatting) {
              console.log(`Game ${game._id}: Player ${i+1} has malformed card objects, fixing...`);
              
              // Format all cards properly
              const formattedDeck = ensureProperDeckFormat(player.deck);
              
              await VeefriendsGame.updateOne(
                { _id: game._id },
                { $set: { [`players.${i}.deck`]: formattedDeck } }
              );
              
              console.log(`Game ${game._id}: Player ${i+1} cards formatted correctly`);
              gameFixed = true;
            }
          }
        }
        
        // Fix game phase if needed
        if (game.status === 'active' && game.phase === 'draw' && game.cardsInPlay) {
          // If game is stuck in draw phase but has cards in play, move to challengerPick
          if (game.cardsInPlay.player1 && game.cardsInPlay.player2) {
            console.log(`Game ${game._id}: Found active game stuck in draw phase, moving to challengerPick`);
            
            await VeefriendsGame.updateOne(
              { _id: game._id },
              { 
                $set: { 
                  phase: 'challengerPick',
                  availableAttributes: ['skill', 'stamina', 'aura'],
                  challengeAttribute: null
                } 
              }
            );
            
            gameFixed = true;
          }
        }
        
        if (gameFixed) {
          fixedGames++;
        } else {
          skippedGames++;
        }
      } catch (gameError) {
        console.error(`Error processing game ${game._id}:`, gameError);
        errorGames++;
      }
    }
    
    console.log(`Cleanup complete.`);
    console.log(`Fixed games: ${fixedGames}`);
    console.log(`Skipped games (no issues found): ${skippedGames}`);
    console.log(`Failed games (errors): ${errorGames}`);
    
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
}

// Run the cleanup
cleanup();
