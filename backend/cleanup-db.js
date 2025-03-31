// Cleanup script for fixing broken deck data in MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import { fixDeckStorage, getMongoDb } from './src/utils/deckStoreFix.js';

dotenv.config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veefriends-game';

/**
 * Fix broken deck arrays in VeefriendsGame documents
 */
async function cleanupGames() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = getMongoDb(mongoose);
    
    if (!db) {
      throw new Error('Failed to get MongoDB database connection');
    }
    
    // Find games with broken deck data
    const games = await db.collection('veefriendsGames').find({}).toArray();
    console.log(`Found ${games.length} games in database`);
    
    let fixedGames = 0;
    let skippedGames = 0;
    let failedGames = 0;
    
    for (const game of games) {
      console.log(`\nProcessing game ${game._id}...`);
      
      // Skip games without players
      if (!game.players || !Array.isArray(game.players) || game.players.length === 0) {
        console.log('  - No players in game, skipping');
        skippedGames++;
        continue;
      }
      
      let gameFixed = false;
      
      // Process each player's deck
      for (let playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
        const player = game.players[playerIndex];
        if (!player) continue;
        
        console.log(`  - Checking player ${playerIndex + 1} (${player.username || 'Unknown'})...`);
        
        // Check if deck needs fixing - we'll fix if:
        // 1. It's a string (possibly with newlines)
        // 2. It's empty
        // 3. It's not an array
        const needsFixing = 
          !player.deck || 
          typeof player.deck === 'string' || 
          !Array.isArray(player.deck) || 
          player.deck.length === 0;
          
        if (needsFixing) {
          console.log(`    Deck needs fixing!`);
          
          // Create a minimal emergency deck if we can't recover
          const emergencyDeck = Array.from({ length: 5 }, (_, i) => ({
            id: `emergency-${Date.now()}-${i}`,
            name: `Emergency Card ${i+1}`,
            skill: 10 + i,
            stamina: 10 + i,
            aura: 10 + i,
            baseTotal: 30 + i*3,
            finalTotal: 30 + i*3,
            rarity: i % 2 === 0 ? 'common' : 'rare',
            character: `Character ${i+1}`,
            type: 'standard',
            unlocked: true
          }));
            
          // Try to fix the deck using our reliable fix utility
          try {
            const success = await fixDeckStorage(db, game._id.toString(), playerIndex, emergencyDeck);
            if (success) {
              console.log(`    ✅ Fixed player ${playerIndex + 1}'s deck`);
              gameFixed = true;
            } else {
              console.log(`    ⚠️ Failed to fix player ${playerIndex + 1}'s deck`);
            }
          } catch (error) {
            console.error(`    ❌ Error fixing deck for player ${playerIndex + 1}:`, error);
          }
        } else {
          console.log(`    ✓ Deck appears valid (${player.deck.length} cards)`);
        }
      }
      
      if (gameFixed) {
        fixedGames++;
      } else {
        skippedGames++;
      }
    }
    
    console.log('\n--- Database Cleanup Summary ---');
    console.log(`Total games: ${games.length}`);
    console.log(`Fixed games: ${fixedGames}`);
    console.log(`Skipped games: ${skippedGames}`);
    console.log(`Failed games: ${failedGames}`);
    console.log('\nCleanup complete. You can now run the server.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the cleanup
cleanupGames().then(() => process.exit(0));
