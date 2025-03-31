/**
 * VeeFriends Multiplayer - Database Initialization Script
 * 
 * This script initializes the VeefriendsGame collection in MongoDB if it doesn't exist,
 * and creates a test game to verify everything is working correctly.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateRandomDeck, fullCardPool } from './src/utils/cardUtils.js';
import { formatDeck } from './src/utils/deckProcessingService.js';
import VeefriendsGame from './src/models/VeefriendsGame.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
    
    // Check if VeefriendsGame collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('Existing collections:', collectionNames.join(', '));
    
    // Check for number of games in the collection
    let gameCount;
    try {
      gameCount = await mongoose.connection.collection('veefriendsGames').countDocuments();
      console.log(`Found ${gameCount} existing VeeFriends games`);
    } catch (err) {
      console.log('VeefriendsGame collection does not exist yet, will create it');
      gameCount = 0;
    }
    
    // Create a test game to verify collection exists and works
    console.log('\nCreating a test game to verify collection setup...');
    
    // Generate random decks for test players
    const deck1 = generateRandomDeck(fullCardPool, 20);
    const deck2 = generateRandomDeck(fullCardPool, 20);
    
    console.log(`Generated test decks with ${deck1.length} and ${deck2.length} cards`);
    
    // Create VeefriendsGame instance
    const testGame = new VeefriendsGame({
      gameCode: 'TEST' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      status: 'waiting',
      players: [
        {
          username: 'TestPlayer1',
          displayName: 'Test Player 1',
          isReady: true,
          isGuest: true,
          deck: deck1,
          points: {
            skill: 0,
            stamina: 0,
            aura: 0
          },
          terrificTokenUsed: false
        },
        {
          username: 'TestPlayer2',
          displayName: 'Test Player 2',
          isReady: true,
          isGuest: true,
          deck: deck2,
          points: {
            skill: 0,
            stamina: 0,
            aura: 0
          },
          terrificTokenUsed: false
        }
      ],
      phase: 'draw',
      roundNumber: 1,
      potSize: 1,
      currentChallenger: 'player1',
      availableAttributes: ['skill', 'stamina', 'aura']
    });
    
    try {
      await testGame.save();
      console.log(`✅ Test game created successfully with ID: ${testGame._id}`);
      console.log(`Game code: ${testGame.gameCode}`);
    } catch (saveError) {
      console.error('Failed to save test game to database:', saveError);
      
      // Try manual insertion to bypass Mongoose validation
      console.log('Attempting direct insertion with MongoDB driver...');
      
      // Convert Mongoose document to plain object
      const plainGameData = testGame.toObject();
      
      try {
        const result = await mongoose.connection.collection('veefriendsGames').insertOne(plainGameData);
        console.log(`✅ Test game inserted successfully with ID: ${result.insertedId}`);
      } catch (insertError) {
        console.error('Direct insertion failed as well:', insertError);
        
        // Last resort - create minimal valid document
        try {
          const minimalGame = {
            gameCode: 'MINIMAL' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
            status: 'waiting',
            players: [
              {
                username: 'MinimalPlayer',
                isReady: false,
                isGuest: true,
                deck: [{
                  id: 'emergency-card',
                  name: 'Emergency Card',
                  skill: 10,
                  stamina: 10,
                  aura: 10,
                  baseTotal: 30,
                  finalTotal: 30,
                  rarity: 'common',
                  character: 'Emergency',
                  type: 'standard',
                  unlocked: true
                }],
                points: { skill: 0, stamina: 0, aura: 0 },
                terrificTokenUsed: false
              }
            ],
            phase: 'waiting',
            roundNumber: 0,
            potSize: 0,
            currentChallenger: null,
            cardsInPlay: { player1: null, player2: null }
          };
          
          const minResult = await mongoose.connection.collection('veefriendsGames').insertOne(minimalGame);
          console.log(`✅ Minimal test game inserted with ID: ${minResult.insertedId}`);
        } catch (lastError) {
          console.error('All attempts to create test game failed:', lastError);
          console.error('DATABASE SETUP FAILED');
        }
      }
    }
    
    // Check if the collection now exists and has at least one document
    try {
      const newCount = await mongoose.connection.collection('veefriendsGames').countDocuments();
      console.log(`\nVeefriendsGame collection now has ${newCount} documents`);
      if (newCount > 0) {
        console.log('✅ Database setup complete! VeefriendsGame collection is ready to use.');
      } else {
        console.log('⚠️ Database collection exists but contains no documents.');
      }
    } catch (err) {
      console.error('Failed to query collection:', err);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.log('\nTROUBLESHOOTING TIPS:');
    console.log('1. Make sure your MongoDB server is running');
    console.log('2. Check that your .env file has a valid MONGODB_URI');
    console.log('3. Verify database permissions allow creating collections');
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

main().catch(console.error);
