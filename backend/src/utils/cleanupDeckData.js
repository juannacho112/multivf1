/**
 * Script to clean up MongoDB VeefriendsGame documents with stringified decks
 * Finds all games where players have string decks and converts them to proper objects
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import VeefriendsGame from '../models/VeefriendsGame.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veefriends';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
};

// Clean up deck data
const cleanupDeckData = async () => {
  try {
    // Find all games
    console.log('Finding all VeefriendsGame documents...');
    const games = await VeefriendsGame.find();
    console.log(`Found ${games.length} games`);
    
    let cleanedGamesCount = 0;
    let totalPlayersChecked = 0;
    let playersWithStringDecksCount = 0;
    let failedCleanupCount = 0;
    
    // Iterate through each game
    for (const game of games) {
      let gameModified = false;
      
      if (game.players && Array.isArray(game.players)) {
        totalPlayersChecked += game.players.length;
        
        // Process each player
        for (let i = 0; i < game.players.length; i++) {
          const player = game.players[i];
          
          // Check if deck exists and is a string
          if (player.deck && typeof player.deck === 'string') {
            playersWithStringDecksCount++;
            console.log(`Found string deck for player ${player.username} in game ${game.gameCode}`);
            
            try {
              // Clean up the deck string and parse it
              const deckString = player.deck;
              const cleanedString = deckString.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
              
              try {
                // Parse the cleaned string
                const parsedDeck = JSON.parse(cleanedString);
                
                // Validate the parsed deck
                if (!Array.isArray(parsedDeck)) {
                  throw new Error('Parsed deck is not an array');
                }
                
                // Update the player's deck
                game.players[i].deck = parsedDeck;
                gameModified = true;
                console.log(`  Successfully cleaned deck for ${player.username}`);
              } catch (parseError) {
                failedCleanupCount++;
                console.error(`  Error parsing cleaned deck string for player ${player.username}:`, parseError);
              }
            } catch (error) {
              failedCleanupCount++;
              console.error(`  Error processing deck for player ${player.username}:`, error);
            }
          }
        }
      }
      
      // Save the game if modified
      if (gameModified) {
        try {
          await game.save();
          cleanedGamesCount++;
          console.log(`Game ${game.gameCode} updated successfully`);
        } catch (saveError) {
          console.error(`Error saving game ${game.gameCode}:`, saveError);
        }
      }
    }
    
    // Print summary
    console.log('\nCleanup Summary:');
    console.log(`Total games checked: ${games.length}`);
    console.log(`Total players checked: ${totalPlayersChecked}`);
    console.log(`Players with string decks: ${playersWithStringDecksCount}`);
    console.log(`Games updated: ${cleanedGamesCount}`);
    console.log(`Failed cleanups: ${failedCleanupCount}`);
    
  } catch (error) {
    console.error('Error in cleanup process:', error);
  }
};

// Main function
const main = async () => {
  try {
    // Connect to database
    const isConnected = await connectToDatabase();
    if (!isConnected) {
      process.exit(1);
    }
    
    // Run the cleanup process
    console.log('Starting deck data cleanup...');
    await cleanupDeckData();
    console.log('Cleanup process completed');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
};

// Run the script
main();
