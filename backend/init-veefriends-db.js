// Initialize VeeFriends game database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import VeefriendsGame from './src/models/VeefriendsGame.js';
import { fixDeckStorage, getMongoDb } from './src/utils/deckStoreFix.js';

dotenv.config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veefriends-game';

// Sample card data for test games
const createSampleCard = (index, rarity = 'common') => ({
  id: `sample-card-${index}-${uuidv4().substring(0, 8)}`,
  name: `Sample Card ${index}`,
  skill: Math.floor(Math.random() * 20) + 5,
  stamina: Math.floor(Math.random() * 20) + 5,
  aura: Math.floor(Math.random() * 20) + 5,
  baseTotal: 0, // Will be calculated
  finalTotal: 0, // Will be calculated
  rarity,
  character: `Character ${index % 10}`,
  type: 'standard',
  unlocked: true
});

// Generate sample deck
const generateSampleDeck = (size = 10) => {
  const deck = [];
  for (let i = 1; i <= size; i++) {
    const card = createSampleCard(i, i % 5 === 0 ? 'rare' : 'common');
    // Calculate totals
    card.baseTotal = card.skill + card.stamina + card.aura;
    card.finalTotal = card.baseTotal;
    deck.push(card);
  }
  return deck;
};

// Initialize database
async function initDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Check for VeefriendsGame collection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasVeefriendsGameCollection = collections.some(c => c.name === 'veefriendsGames');
    
    if (!hasVeefriendsGameCollection) {
      console.log('Creating VeefriendsGame collection...');
      await db.createCollection('veefriendsGames');
      console.log('✅ Collection created');
    } else {
      console.log('✅ VeefriendsGame collection already exists');
    }
    
    // Create a test game if none exists
    const count = await VeefriendsGame.countDocuments();
    
    if (count === 0) {
      console.log('Creating test game...');
      
      // Create a new game
      const game = new VeefriendsGame({
        gameCode: 'TEST123',
        isPrivate: false,
        status: 'waiting'
      });
      
      // Add test players
      await game.addPlayer({
        _id: '000000000000000000000001', // Fake ObjectId
        username: 'TestPlayer1',
        displayName: 'Test Player 1'
      }, false);
      
      await game.addPlayer({
        _id: '000000000000000000000002', // Fake ObjectId 
        username: 'TestPlayer2',
        displayName: 'Test Player 2'
      }, false);
      
      // Save the game first to generate an _id
      await game.save();
      
      console.log(`Test game created with ID: ${game._id} and code: ${game.gameCode}`);
      
      // Generate and add decks using direct MongoDB access to bypass any validation issues
      console.log('Adding test decks...');
      
      const player1Deck = generateSampleDeck(10);
      const player2Deck = generateSampleDeck(10);
      
      // Use our deck storage fix utility
      const mongoDb = getMongoDb(mongoose);
      
      if (mongoDb) {
        const success1 = await fixDeckStorage(mongoDb, game._id.toString(), 0, player1Deck);
        const success2 = await fixDeckStorage(mongoDb, game._id.toString(), 1, player2Deck);
        
        console.log(`Added decks successfully: Player 1: ${success1}, Player 2: ${success2}`);
      } else {
        console.error('Failed to get MongoDB connection for deck storage');
      }
      
      console.log('✅ Test game created with players and decks');
    } else {
      console.log(`✅ ${count} games already exist in the database`);
    }
    
    console.log('\nDatabase initialization complete. You can now run the server.');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the initialization
initDatabase().then(() => process.exit(0));
