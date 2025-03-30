/**
 * This is a test script to verify the VeeFriends deck handling fix
 * It simulates the problematic scenario that was causing validation errors
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VeefriendsGame from './src/models/VeefriendsGame.js';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';

// Load environment variables
dotenv.config();

// Test data that mimics the problem scenario
const problematicDeck = `[
  {
    id: '9pu9w3im4gcf2zkh5l4kib',
    name: 'Balanced Bison',
    skill: 18,
    stamina: 18,
    aura: 18,
    baseTotal: 54,
    finalTotal: 54,
    rarity: 'common',
    character: 'Bison',
    type: 'standard',
    unlocked: true
  },
  {
    id: 'erolsyjkepgty8x106i52q',
    name: 'Honest Hippopotamus',
    skill: 13,
    stamina: 20,
    aura: 29,
    baseTotal: 62,
    finalTotal: 65,
    rarity: 'rare',
    character: 'Hippopotamus',
    type: 'standard',
    unlocked: true
  }]`;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veefriends';
    console.log(`Connecting to MongoDB: ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Create test game with problematic deck
const testFixWithProblematicDeck = async () => {
  console.log('\n🧪 TESTING DECK HANDLING FIX');
  console.log('\n1️⃣ Testing direct assignment of problematic deck string to VeefriendsGame model...');
  
  // Create a new test game with a unique code
  const testGameCode = 'TEST' + Math.floor(Math.random() * 10000).toString();
  const testGame = new VeefriendsGame({
    gameCode: testGameCode,
    status: 'waiting',
    players: [
      {
        username: 'test_player1',
        displayName: 'Test Player 1',
        isGuest: true,
        isReady: true,
        // Assigning problematic deck directly
        deck: problematicDeck
      },
      {
        username: 'test_player2',
        displayName: 'Test Player 2',
        isGuest: true,
        isReady: true,
        deck: []
      }
    ]
  });
  
  try {
    console.log('Saving game with problematic deck...');
    await testGame.save();
    console.log('✅ Game saved successfully!');
    
    // Load the game back to verify deck format
    const savedGame = await VeefriendsGame.findOne({ gameCode: testGameCode });
    console.log(`Retrieved game with code: ${savedGame.gameCode}`);
    console.log(`Player 1 deck size: ${savedGame.players[0].deck.length}`);
    if (savedGame.players[0].deck.length > 0) {
      console.log('First card in deck:', {
        id: savedGame.players[0].deck[0].id,
        name: savedGame.players[0].deck[0].name,
        skill: savedGame.players[0].deck[0].skill,
        stamina: savedGame.players[0].deck[0].stamina,
        aura: savedGame.players[0].deck[0].aura
      });
    }
    
    console.log('\n2️⃣ Testing utility function directly with problematic string...');
    const formattedDeck = ensureProperDeckFormat(problematicDeck);
    console.log(`✅ Formatted deck has ${formattedDeck.length} cards`);
    
    // Clean up the test data
    console.log('\n🧹 Cleaning up test data...');
    await VeefriendsGame.deleteOne({ gameCode: testGameCode });
    console.log(`Test game ${testGameCode} deleted`);
    
    console.log('\n🎉 TEST SUCCEEDED! The fix is working properly.');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED! Error:', error);
    
    // Try to clean up anyway
    try {
      await VeefriendsGame.deleteOne({ gameCode: testGameCode });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    return false;
  }
};

// Main function
const runTest = async () => {
  console.log('Starting VeeFriends deck handling fix test...');
  
  // Connect to MongoDB
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB, test aborted.');
    process.exit(1);
  }
  
  // Run the test
  const success = await testFixWithProblematicDeck();
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
};

// Run the test
runTest();
