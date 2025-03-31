/**
 * Simple test script for VeeFriends model
 * Tests MongoDB schema validation with problematic deck data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';

// Load environment variables
dotenv.config();

// Sample problem deck data with newlines
const problematicDeck = `[
  {
    "id": "card1",
    "name": "Test Card 1",
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

// Concatenated string version like in error logs
const concatenatedDeck = "[\\n' +\n" +
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

// Define a simple schema with the deck field
const TestSchema = new mongoose.Schema({
  name: String,
  deck: {
    type: [{
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
    }],
    default: [],
    set: function(cards) {
      // If it's already an array of objects, return as is to avoid processing twice
      if (Array.isArray(cards) && cards.length > 0 && typeof cards[0] === 'object') {
        console.log(`Deck already in array format (${cards.length} cards)`);
        return cards;
      }
      
      try {
        // This should only handle format conversion, not validation
        if (typeof cards === 'string') {
          try {
            // Clean the string and parse using our enhanced formatter
            console.log(`Formatting string deck data...`);
            const formattedDeck = ensureProperDeckFormat(cards);
            console.log(`Deck formatted successfully via utility (${formattedDeck.length} cards)`);
            return formattedDeck;
          } catch (stringError) {
            console.error("Error formatting string deck:", stringError);
            return [];
          }
        }
        return cards;
      } catch (e) {
        console.error("Error in deck setter:", e);
        return [];
      }
    }
  }
});

// Create model
const TestModel = mongoose.model('Test', TestSchema);

// Test function
async function runTest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing with direct formatting ===');
    // Try direct formatting
    console.log('\n1. Testing normal JSON with newlines:');
    const result1 = ensureProperDeckFormat(problematicDeck);
    console.log(`Formatted deck has ${result1.length} cards:`, result1[0]);

    console.log('\n2. Testing concatenated string format:');
    const result2 = ensureProperDeckFormat(concatenatedDeck);
    console.log(`Formatted deck has ${result2.length} cards:`, result2[0]);

    console.log('\n=== Testing with MongoDB schema ===');
    
    // Create test instance 1
    console.log('\n3. Testing MongoDB schema with normal JSON string:');
    const test1 = new TestModel({
      name: "Test 1",
      deck: problematicDeck
    });
    
    // Save to test validation
    await test1.save();
    console.log('Test 1 saved successfully!');
    console.log('Deck count:', test1.deck.length);
    console.log('First card:', test1.deck[0]);
    
    // Create test instance 2
    console.log('\n4. Testing MongoDB schema with concatenated string:');
    const test2 = new TestModel({
      name: "Test 2",
      deck: concatenatedDeck
    });
    
    // Save to test validation
    await test2.save();
    console.log('Test 2 saved successfully!');
    console.log('Deck count:', test2.deck.length);
    console.log('First card:', test2.deck[0]);
    
    // Test direct MongoDB update
    console.log('\n5. Testing direct MongoDB update:');
    const result = await mongoose.connection.collection('tests').updateOne(
      { name: "Test 1" },
      { $set: { deck: ensureProperDeckFormat(concatenatedDeck) } }
    );
    
    console.log('Direct update result:', result);
    
    const updated = await TestModel.findOne({ name: "Test 1" });
    console.log('Updated document deck count:', updated.deck.length);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

// Run the test
runTest();
