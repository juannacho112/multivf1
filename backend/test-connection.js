/**
 * VeeFriends Multiplayer - Test Connection and Fixes
 * 
 * This script verifies your MongoDB connection and checks for the fixes applied.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { formatDeck } from './src/utils/deckProcessingService.js';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';
import { generateRandomDeck, fullCardPool } from './src/utils/cardUtils.js';

// Load environment variables
dotenv.config();

// Test formatting functions with problematic input
const problematicString = `[
  {
    "id": "card1",
    "name": "Test Card",
    "skill": 10,
    "stamina": 10,
    "aura": 10,
    "baseTotal": 30,
    "finalTotal": 30,
    "rarity": "common",
    "character": "Test",
    "type": "standard",
    "unlocked": true
  }
]`;

const concatenatedString = "[\\n' +\n" +
  "  '  {\\n' +\n" +
  "    \"id: 'card1',\\n\" +\n" +
  "    \"name: 'Test Card',\\n\" +\n" +
  "    '    skill: 10,\\n' +\n" +
  "    '    stamina: 10,\\n' +\n" +
  "    '    aura: 10,\\n' +\n" +
  "    '    baseTotal: 30,\\n' +\n" +
  "    '    finalTotal: 30,\\n' +\n" +
  "    \"    rarity: 'common',\\n\" +\n" +
  "    \"    character: 'Test',\\n\" +\n" +
  "    \"    type: 'standard',\\n\" +\n" +
  "    '    unlocked: true\\n' +\n" +
  "    '  }\\n' +\n" +
  "  ']";

// Main test function
async function runTests() {
  console.log('=======================================');
  console.log('VeeFriends Multiplayer - Test Suite');
  console.log('=======================================\n');

  // Test 1: Deck formatting on problematic inputs
  console.log('TEST 1: Deck Formatting');
  console.log('-----------------------');
  
  try {
    console.log('Testing normal JSON string:');
    const result1 = ensureProperDeckFormat(problematicString);
    console.log(`✅ Success! Parsed ${result1.length} cards`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
  
  try {
    console.log('\nTesting concatenated string format:');
    const result2 = ensureProperDeckFormat(concatenatedString);
    console.log(`✅ Success! Parsed ${result2.length} cards`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
  
  // Test 2: MongoDB connection
  console.log('\nTEST 2: MongoDB Connection');
  console.log('--------------------------');
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
    
    // Check for VeefriendsGame collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasVeefriendsCollection = collections.some(c => c.name === 'veefriendsGames');
    
    if (hasVeefriendsCollection) {
      console.log('✅ VeefriendsGame collection exists');
      
      // Count games
      const gameCount = await mongoose.connection.collection('veefriendsGames').countDocuments();
      console.log(`Found ${gameCount} VeeFriends games`);
      
      if (gameCount > 0) {
        // Check a sample game
        const sampleGame = await mongoose.connection.collection('veefriendsGames')
          .findOne({}, { projection: { players: 1 }});
        
        if (sampleGame && sampleGame.players && sampleGame.players.length > 0) {
          const player = sampleGame.players[0];
          console.log(`Sample player: ${player.username || 'Unknown'}`);
          
          if (player.deck) {
            if (Array.isArray(player.deck)) {
              console.log(`✅ Player has proper deck array with ${player.deck.length} cards`);
            } else if (typeof player.deck === 'string') {
              console.log(`⚠️ Player has string deck - this will be fixed by cleanup script`);
            } else {
              console.log(`⚠️ Player has unexpected deck type: ${typeof player.deck}`);
            }
          } else {
            console.log(`⚠️ Player has no deck`);
          }
        }
      }
    } else {
      console.log('⚠️ VeefriendsGame collection does not exist yet (OK for new installations)');
    }
    
  } catch (error) {
    console.log(`❌ MongoDB connection failed: ${error.message}`);
    console.log('\nMake sure:');
    console.log('1. Your MongoDB server is running');
    console.log('2. Your .env file contains a valid MONGODB_URI');
    console.log('3. The database and user credentials are correct');
  } finally {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    } catch (e) {
      // Ignore close errors
    }
  }
  
  // Test 3: Card Generation
  console.log('\nTEST 3: Card Generation');
  console.log('----------------------');
  
  try {
    console.log('Generating random deck...');
    const deck = generateRandomDeck(fullCardPool, 20);
    console.log(`✅ Successfully generated deck with ${deck.length} cards`);
    console.log('Sample card:', deck[0]);
  } catch (error) {
    console.log(`❌ Failed to generate deck: ${error.message}`);
  }
  
  console.log('\n=======================================');
  console.log('Tests complete!');
  console.log('=======================================');
}

// Run tests
runTests().catch(console.error);
