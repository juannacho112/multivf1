/**
 * Simple test script to isolate and test the deck validation issue
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';

// Load environment variables
dotenv.config();

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

// Create a simpler schema just for testing
const testCardSchema = new mongoose.Schema({
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
});

const TestPlayerSchema = new mongoose.Schema({
  username: String,
  deck: [testCardSchema]
});

const TestGameModel = mongoose.model('TestGame', new mongoose.Schema({
  gameCode: String,
  players: [TestPlayerSchema]
}));

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

const runTest = async () => {
  console.log('Starting simple test...');
  
  if (!(await connectDB())) {
    console.error('Failed to connect to MongoDB, test aborted.');
    process.exit(1);
  }
  
  try {
    // Use our utility to format the problematic deck
    console.log('Formatting deck using our utility...');
    const formattedDeck = ensureProperDeckFormat(problematicDeck);
    console.log(`Formatted deck has ${formattedDeck.length} cards`);
    
    if (formattedDeck.length === 0) {
      console.error('Failed to format deck, aborting test.');
      process.exit(1);
    }
    
    // Log a sample of the formatted deck to verify structure
    console.log('Sample formatted card:', formattedDeck[0]);

    // Create a test game with the formatted deck directly
    console.log('\nTesting with our simple test model...');
    const testGame = new TestGameModel({
      gameCode: 'SIMPLE' + Math.floor(Math.random() * 10000),
      players: [{
        username: 'test_player',
        deck: formattedDeck
      }]
    });

    // Save it to MongoDB
    console.log('Saving test game...');
    await testGame.save();
    console.log('✅ Test game saved successfully!');
    
    // Now test with direct object assignment
    console.log('\nTrying direct object test...');
    const directTestGame = new TestGameModel({
      gameCode: 'DIRECT' + Math.floor(Math.random() * 10000),
      players: [{
        username: 'direct_test_player',
        deck: [
          {
            id: 'test1',
            name: 'Test Card 1',
            skill: 10,
            stamina: 20,
            aura: 30,
            baseTotal: 60,
            finalTotal: 60,
            rarity: 'common',
            character: 'Test Character',
            type: 'standard',
            unlocked: true
          }
        ]
      }]
    });
    
    console.log('Saving direct test game...');
    await directTestGame.save();
    console.log('✅ Direct test game saved successfully!');
    
    // Clean up the test data
    await TestGameModel.deleteOne({ _id: testGame._id });
    await TestGameModel.deleteOne({ _id: directTestGame._id });
    
    console.log('\n🎉 SIMPLE TEST SUCCEEDED!');
  } catch (error) {
    console.error('\n❌ TEST FAILED! Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the test
runTest();
