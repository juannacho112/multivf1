/**
 * Cleanup Deck Data Script
 * 
 * This script connects to MongoDB and fixes any VeeFriends game records 
 * that have invalid deck data due to newline characters or other formatting issues.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI environment variable not set');
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    
    // Get the MongoDB native driver connection
    const db = mongoose.connection.db;
    
    // Process all VeeFriends games
    await cleanupGames(db);
    
    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to clean up deck data in games
const cleanupGames = async (db) => {
  console.log('Starting cleanup of VeeFriends game deck data...');
  
  // Get all games from the collection
  const games = await db.collection('veefriendsGames').find({}).toArray();
  console.log(`Found ${games.length} games to process`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Process each game
  for (const game of games) {
    try {
      let gameUpdated = false;
      
      // Check each player's deck
      if (game.players && Array.isArray(game.players)) {
        for (let i = 0; i < game.players.length; i++) {
          const player = game.players[i];
          
          // Check if deck is a string (incorrectly stored)
          if (player.deck && typeof player.deck === 'string') {
            console.log(`Game ${game._id}: Player ${i+1} has deck stored as string`);
            
            try {
              // Clean up the string and parse it
              const cleanedString = player.deck
                .replace(/\n/g, '')
                .replace(/\t/g, '')
                .replace(/\r/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              
              // Skip invalid formats
              if (
                cleanedString.includes("' +") || 
                cleanedString.includes("'+") ||
                !cleanedString.startsWith('[') || 
                !cleanedString.endsWith(']')
              ) {
                console.log(`Game ${game._id}: Player ${i+1} has invalid deck string format, setting to empty array`);
                game.players[i].deck = [];
                gameUpdated = true;
                continue;
              }
              
              // Try to parse the JSON
              const parsedDeck = JSON.parse(cleanedString);
              
              if (!Array.isArray(parsedDeck)) {
                console.log(`Game ${game._id}: Player ${i+1} parsed deck is not an array, setting to empty array`);
                game.players[i].deck = [];
              } else {
                // Validate each card
                const validatedDeck = parsedDeck.map(card => ({
                  id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
                  name: String(card.name || 'Card'),
                  skill: Number(card.skill || 0),
                  stamina: Number(card.stamina || 0),
                  aura: Number(card.aura || 0),
                  baseTotal: Number(card.baseTotal || 0),
                  finalTotal: Number(card.finalTotal || 0),
                  rarity: String(card.rarity || 'common'),
                  character: String(card.character || 'Character'),
                  type: String(card.type || 'standard'),
                  unlocked: Boolean(card.unlocked !== false)
                }));
                
                game.players[i].deck = validatedDeck;
                console.log(`Game ${game._id}: Fixed player ${i+1} deck with ${validatedDeck.length} cards`);
              }
              
              gameUpdated = true;
            } catch (parseError) {
              console.error(`Game ${game._id}: Error parsing deck for player ${i+1}:`, parseError);
              // Reset to empty array on error
              game.players[i].deck = [];
              gameUpdated = true;
            }
          }
          
          // Handle case where deck is an empty array or invalid value
          else if (!player.deck || !Array.isArray(player.deck)) {
            console.log(`Game ${game._id}: Player ${i+1} has invalid deck type (${typeof player.deck}), setting to empty array`);
            game.players[i].deck = [];
            gameUpdated = true;
          }
        }
      }
      
      // Save game if updated
      if (gameUpdated) {
        await db.collection('veefriendsGames').updateOne(
          { _id: game._id },
          { $set: { players: game.players } }
        );
        fixedCount++;
      }
    } catch (error) {
      console.error(`Error processing game ${game._id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Cleanup summary:`);
  console.log(`- Total games processed: ${games.length}`);
  console.log(`- Games fixed: ${fixedCount}`);
  console.log(`- Errors encountered: ${errorCount}`);
};

// Run the connection function
connectDB();
