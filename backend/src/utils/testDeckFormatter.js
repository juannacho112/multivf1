/**
 * Test script for deckFormatter utility
 * Tests handling of problematic string formats with newlines
 */

import { ensureProperDeckFormat } from './deckFormatter.js';

// Test different formats
function runTests() {
  console.log('\n=== Testing Deck Formatter ===\n');
  
  // Test 1: Normal JSON array
  const test1 = '[{"id":"card1","name":"Test Card","skill":10,"stamina":10,"aura":10}]';
  testFormatter('Test 1: Valid JSON', test1);
  
  // Test 2: Array with newlines
  const test2 = `[
    {"id":"card1","name":"Test Card","skill":10,"stamina":10,"aura":10}
  ]`;
  testFormatter('Test 2: JSON with newlines', test2);
  
  // Test 3: JavaScript object notation
  const test3 = "[{id: 'card1', name: 'Test Card', skill: 10, stamina: 10, aura: 10}]";
  testFormatter('Test 3: JavaScript notation', test3);
  
  // Test 4: The problematic concatenated string format from logs
  const test4 = "[\\n' +\n" +
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
  testFormatter('Test 4: Concatenated string with newlines', test4);
  
  // Test 5: Bad data
  const test5 = "This is not valid JSON or JS";
  testFormatter('Test 5: Invalid data', test5);
  
  // Test 6: Empty string
  const test6 = "";
  testFormatter('Test 6: Empty string', test6);
  
  // Test 7: Already an array of objects
  const test7 = [
    {id: 'card1', name: 'Test Card 1', skill: 10, stamina: 10, aura: 10},
    {id: 'card2', name: 'Test Card 2', skill: 20, stamina: 20, aura: 20}
  ];
  testFormatter('Test 7: Array of objects', test7);
  
  console.log('\n=== Testing Complete ===\n');
}

// Run test for a single case
function testFormatter(testName, input) {
  console.log(`\n--- ${testName} ---`);
  console.log('Input:', typeof input === 'string' ? input.substring(0, 50) + '...' : input);
  
  try {
    const result = ensureProperDeckFormat(input);
    console.log('Success:', result.length, 'cards processed');
    // Print first card as sample
    if (result.length > 0) {
      console.log('Sample card:', JSON.stringify(result[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all tests
runTests();
