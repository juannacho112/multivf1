/**
 * Test script to verify the deckFormatter utility functions
 */
import { ensureProperDeckFormat } from './deckFormatter.js';

// Test cases
console.log('\n==== TESTING DECK FORMATTER UTILITY ====\n');

// Test Case 1: Properly formatted array of card objects
console.log('Test Case 1: Properly formatted array of card objects');
try {
  const validCards = [
    {
      id: 'test1',
      name: 'Test Card 1',
      skill: 10,
      stamina: 20,
      aura: 30,
      baseTotal: 60,
      finalTotal: 60,
      rarity: 'common',
      character: 'Test Character 1',
      type: 'standard',
      unlocked: true
    },
    {
      id: 'test2',
      name: 'Test Card 2',
      skill: 15,
      stamina: 25,
      aura: 35,
      baseTotal: 75,
      finalTotal: 75,
      rarity: 'rare',
      character: 'Test Character 2',
      type: 'standard',
      unlocked: true
    }
  ];
  
  const result = ensureProperDeckFormat(validCards);
  console.log(`✅ Success! Processed ${result.length} valid cards.`);
} catch (error) {
  console.error(`❌ Failed: ${error.message}`);
}

// Test Case 2: String with newlines
console.log('\nTest Case 2: String with newlines');
try {
  const stringWithNewlines = `[\n  {\n    "id": "test1",\n    "name": "Test Card 1",\n    "skill": 10,\n    "stamina": 20,\n    "aura": 30,\n    "baseTotal": 60,\n    "finalTotal": 60,\n    "rarity": "common",\n    "character": "Test Character 1",\n    "type": "standard",\n    "unlocked": true\n  }\n]`;
  
  const result = ensureProperDeckFormat(stringWithNewlines);
  console.log(`✅ Success! Processed ${result.length} cards from string with newlines.`);
} catch (error) {
  console.error(`❌ Failed: ${error.message}`);
}

// Test Case 3: Invalid card missing required properties
console.log('\nTest Case 3: Invalid card missing required properties');
try {
  const invalidCards = [
    {
      id: 'test1',
      name: 'Test Card 1'
      // Missing skill, stamina, aura
    }
  ];
  
  const result = ensureProperDeckFormat(invalidCards);
  console.log(`Result: ${result.length} cards after filtering invalid ones.`);
  if (result.length === 0) {
    console.log('✅ Success! Invalid card was properly filtered out.');
  } else {
    console.log('❌ Failed: Invalid card was not filtered out.');
  }
} catch (error) {
  console.error(`❌ Failed: ${error.message}`);
}

// Test Case 4: The actual error from logs
console.log('\nTest Case 4: Error scenario from logs');
try {
  const errorString = `[
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
  
  const result = ensureProperDeckFormat(errorString);
  console.log(`✅ Success! Processed ${result.length} cards from error scenario.`);
  console.log('First card processed:', result[0]);
} catch (error) {
  console.error(`❌ Failed: ${error.message}`);
}

console.log('\n==== TEST COMPLETED ====\n');
