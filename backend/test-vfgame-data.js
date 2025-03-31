/**
 * Test VeefriendsGame Data Integrity
 * 
 * This script connects to MongoDB and inspects VeeFriends game records
 * to verify data integrity and make necessary fixes.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fixDeckStorage, getMongoDb } from './src/utils/deckStoreFix.js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Generate a minimal emergency card
const createEmergencyCard = (index) => ({
  id: `emergency-card-${Date.now()}-${index}`,
  name: `Emergency Card ${index}`,
  skill: 10 + Math.floor(Math.random() * 10),
  stamina: 10 + Math.floor(Math.random() * 10),
  aura: 10 + Math.floor(Math.random() * 10),
  baseTotal: 30,
  finalTotal: 30,
  rarity: "common",
  character: "Emergency",
  type: "standard",
  unlocked: true
});

// Create a minimal emergency deck
const createEmergencyDeck = (size = 10) => {
  const deck = [];
  for (let i = 0; i < size; i++) {
    deck.push(createEmergencyCard(i + 1));
  }
  return deck;
};

// Connect to MongoDB
const connectAndFix = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI environment variable not set');
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    
    const db = mongoose.connection.db;
    console.log("Checking VeefriendsGame collection...");
    
    // Find all active games
    const games = await db.collection('veefriendsGames').find({
      status: { $in: ['active', 'waiting'] }
    }).toArray();
    
    console.log(`Found ${games.length} active/waiting games.`);
    
    // Process each game
    for (const game of games) {
      console.log(`\nProcessing game: ${game._id} (Code: ${game.gameCode}), Status: ${game.status}`);
      console.log(`Phase: ${game.phase}`);
      
      let needsUpdate = false;
      let updateFields = {};
      
      // Check cardsInPlay
      if (!game.cardsInPlay) {
        console.log("Missing cardsInPlay, creating empty structure");
        updateFields.cardsInPlay = { player1: null, player2: null };
        needsUpdate = true;
      }
      
      // Process each player
      if (game.players && game.players.length > 0) {
        console.log(`Game has ${game.players.length} players`);
        
        for (let i = 0; i < game.players.length; i++) {
          const player = game.players[i];
          console.log(`Player ${i + 1} (${player.username}): Deck size = ${Array.isArray(player.deck) ? player.deck.length : 'Not an array'}`);
          
          // Fix missing or invalid deck
          if (!player.deck || !Array.isArray(player.deck) || player.deck.length === 0) {
            console.log(`Creating emergency deck for player ${i + 1}`);
            const emergencyDeck = createEmergencyDeck();
            
            // Update using the deck storage fix function
            const success = await fixDeckStorage(db, game._id.toString(), i, emergencyDeck);
            
            if (success) {
              console.log(`Successfully created emergency deck for player ${i + 1}`);
            } else {
              console.error(`Failed to create emergency deck for player ${i + 1}`);
            }
          } else if (player.deck.length < 5) {
            console.log(`Player ${i + 1} has only ${player.deck.length} cards, adding more emergency cards`);
            
            // Add more cards to the deck
            const additionalCards = createEmergencyDeck(10 - player.deck.length);
            const updatedDeck = [...player.deck, ...additionalCards];
            
            // Update using the deck storage fix function
            await fixDeckStorage(db, game._id.toString(), i, updatedDeck);
          }
        }
      }
      
      // Fix missing fields
      if (!game.deniedAttributes) {
        updateFields.deniedAttributes = [];
        needsUpdate = true;
      }
      
      if (!game.availableAttributes) {
        updateFields.availableAttributes = ['skill', 'stamina', 'aura'];
        needsUpdate = true;
      }
      
      if (game.status === 'active' && !game.currentChallenger) {
        updateFields.currentChallenger = 'player1';
        needsUpdate = true;
      }
      
      if (!game.roundNumber) {
        updateFields.roundNumber = 1;
        needsUpdate = true;
      }
      
      if (!game.potSize) {
        updateFields.potSize = 1;
        needsUpdate = true;
      }
      
      if (!game.burnPile) {
        updateFields.burnPile = [];
        needsUpdate = true;
      }
      
      // Update the game if needed
      if (needsUpdate) {
        console.log("Applying updates to game:");
        console.log(updateFields);
        
        await db.collection('veefriendsGames').updateOne(
          { _id: game._id },
          { $set: updateFields }
        );
        
        console.log("Game updated successfully");
      }
    }
    
    console.log("\nFinished processing all games. Repairs completed.");
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

// Run the function
console.log("Starting VeefriendsGame data integrity test...");
connectAndFix();
