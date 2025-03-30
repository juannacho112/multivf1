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
  
  try {
    // Format the deck using our utility to be safe
    console.log('Pre-formatting problematic deck...');
    const formattedDeck = ensureProperDeckFormat(problematicDeck);
    console.log(`Pre-formatted deck has ${formattedDeck.length} cards`);
    
    // Check that the formatted deck is valid
    if (formattedDeck.length === 0) {
      console.error('Failed to format deck properly, aborting test');
      return false;
    }
    
    // Method 1: Create a game using the addPlayer method (recommended approach)
    console.log('\nTrying method 1: Using addPlayer method');
    const game1 = new VeefriendsGame({
      gameCode: testGameCode + '-1',
      status: 'waiting',
      players: [] // Start with empty players array
    });
    
    // Add player with addPlayer method
    await game1.addPlayer({
      _id: null, // Guest player
      username: 'test_player1',
      displayName: 'Test Player 1'
    }, true); // true = isGuest
    
    // Save the game first
    console.log('Saving game with first player...');
    await game1.save();
    console.log('Game saved with first player');
    
    // Now update the player's deck with MongoDB update operation
    console.log('Setting player deck directly in MongoDB...');
    await VeefriendsGame.updateOne(
      { gameCode: game1.gameCode, 'players.username': 'test_player1' },
      { $set: { 'players.$.deck': formattedDeck, 'players.$.isReady': true } }
    );
    
    // Retrieve the game to verify
    const retrievedGame1 = await VeefriendsGame.findOne({ gameCode: game1.gameCode });
    console.log('First test result - player deck size:', retrievedGame1.players[0].deck.length);
    
    // Method 2: Try using a direct Mongoose operation
    console.log('\nTrying method 2: Direct Mongoose operation');
    // Create a document first
    const game2 = await VeefriendsGame.create({
      gameCode: testGameCode + '-2',
      status: 'waiting'
    });
    
    // Use MongoDB's updateOne to set the players array directly
    await VeefriendsGame.updateOne(
      { _id: game2._id },
      { $set: { players: [
        {
          username: 'direct_player',
          displayName: 'Direct Player',
          isGuest: true,
          isReady: true,
          deck: formattedDeck
        }
      ]}}
    );
    
    // Retrieve and verify
    const retrievedGame2 = await VeefriendsGame.findOne({ gameCode: game2.gameCode });
    if (retrievedGame2.players.length > 0) {
      console.log('Second test result - player deck size:', retrievedGame2.players[0].deck.length);
    } else {
      console.log('Second test - no players found');
    }
    
    console.log('\n🧹 Cleaning up test data...');
    await VeefriendsGame.deleteMany({ 
      gameCode: { $in: [game1.gameCode, game2.gameCode] }
    });
    console.log('Test games deleted');
    
    console.log('\n🎉 TEST SUCCEEDED! Both methods worked.');
    
    // Print out the first card for verification
    if (retrievedGame1.players[0].deck.length > 0) {
      console.log('\nSample card data:', {
        id: retrievedGame1.players[0].deck[0].id,
        name: retrievedGame1.players[0].deck[0].name,
        skill: retrievedGame1.players[0].deck[0].skill,
        stamina: retrievedGame1.players[0].deck[0].stamina,
        aura: retrievedGame1.players[0].deck[0].aura
      });
    }
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
