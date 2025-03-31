/**
 * Database Cleanup Script for VeeFriends Multiplayer
 * 
 * This script fixes existing games in the database that might have corrupted deck data.
 * It uses our dedicated deckFormatter utility to ensure all deck data is properly stored.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureProperDeckFormat } from './src/utils/deckFormatter.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
    
    // Find all VeeFriends games
    const games = await mongoose.connection.collection('veefriendsGames').find({}).toArray();
    console.log(`Found ${games.length} VeeFriends games`);
    
    let fixedGames = 0;
    let fixedDecks = 0;
    let errorGames = 0;
    
    // Process each game
    for (const game of games) {
      let gameModified = false;
      console.log(`Processing game ${game._id} (Status: ${game.status}, ${game.players?.length || 0} players)`);
      
      // Skip games with no players
      if (!game.players || !Array.isArray(game.players) || game.players.length === 0) {
        console.log(`  - Skipping game with no players`);
        continue;
      }
      
      // Process each player
      for (let playerIndex = 0; playerIndex < game.players.length; playerIndex++) {
        const player = game.players[playerIndex];
        if (!player) continue;
        
        // Check if player has deck data
        if (!player.deck) {
          console.log(`  - Player ${playerIndex + 1} (${player.username || 'Unknown'}) has no deck`);
          continue;
        }
        
        // Handle string deck data
        if (typeof player.deck === 'string') {
          console.log(`  - Player ${playerIndex + 1} has string deck data, fixing...`);
          try {
            // Parse the deck using our formatter
            const formattedDeck = ensureProperDeckFormat(player.deck);
            
            if (Array.isArray(formattedDeck) && formattedDeck.length > 0) {
              console.log(`  - Successfully parsed string deck: ${formattedDeck.length} cards`);
              
              // Map to plain objects with type conversion
              const plainDeck = formattedDeck.map(card => ({
                id: String(card.id || ''),
                name: String(card.name || 'Unknown Card'),
                skill: Number(card.skill || 10),
                stamina: Number(card.stamina || 10),
                aura: Number(card.aura || 10),
                baseTotal: Number(card.baseTotal || 0),
                finalTotal: Number(card.finalTotal || 0),
                rarity: String(card.rarity || 'common'),
                character: String(card.character || 'Unknown'),
                type: String(card.type || 'standard'),
                unlocked: Boolean(card.unlocked !== false)
              }));
              
              // Update the deck in the game object
              game.players[playerIndex].deck = plainDeck;
              gameModified = true;
              fixedDecks++;
            } else {
              console.log(`  - Failed to parse deck data, creating emergency deck`);
              // Create emergency deck
              game.players[playerIndex].deck = [{
                id: `emergency-${Date.now()}-${playerIndex}`,
                name: "Emergency Card",
                skill: 10,
                stamina: 10,
                aura: 10,
                baseTotal: 30,
                finalTotal: 30,
                rarity: "common",
                character: "Emergency",
                type: "standard",
                unlocked: true
              }];
              gameModified = true;
              fixedDecks++;
            }
          } catch (error) {
            console.error(`  - Error parsing deck data:`, error);
            errorGames++;
          }
        }
        // Handle array decks with validation
        else if (Array.isArray(player.deck)) {
          // Check if deck is empty
          if (player.deck.length === 0) {
            console.log(`  - Player ${playerIndex + 1} has empty deck, creating emergency deck`);
            game.players[playerIndex].deck = [{
              id: `emergency-${Date.now()}-${playerIndex}`,
              name: "Emergency Card",
              skill: 10,
              stamina: 10,
              aura: 10,
              baseTotal: 30,
              finalTotal: 30,
              rarity: "common",
              character: "Emergency",
              type: "standard",
              unlocked: true
            }];
            gameModified = true;
            fixedDecks++;
          } 
          // Check if deck contains valid card objects
          else if (!player.deck.every(card => 
            card && typeof card === 'object' && 
            (card.id !== undefined || card.name !== undefined) &&
            (!isNaN(Number(card.skill)) || !isNaN(Number(card.stamina)) || !isNaN(Number(card.aura)))
          )) {
            console.log(`  - Player ${playerIndex + 1} has invalid card objects, fixing...`);
            try {
              // Ensure each card object has valid properties with type conversion
              const fixedCards = player.deck.map(card => ({
                id: String(card.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
                name: String(card.name || 'Fixed Card'),
                skill: Number(card.skill || 10),
                stamina: Number(card.stamina || 10),
                aura: Number(card.aura || 10),
                baseTotal: Number(card.baseTotal || 30),
                finalTotal: Number(card.finalTotal || 30),
                rarity: String(card.rarity || 'common'),
                character: String(card.character || 'Fixed'),
                type: String(card.type || 'standard'),
                unlocked: Boolean(card.unlocked !== false)
              }));
              
              game.players[playerIndex].deck = fixedCards;
              gameModified = true;
              fixedDecks++;
            } catch (error) {
              console.error(`  - Error fixing card objects:`, error);
              errorGames++;
            }
          } else {
            console.log(`  - Player ${playerIndex + 1} has valid deck with ${player.deck.length} cards`);
          }
        }
      }
      
      // Save changes to the game if modified
      if (gameModified) {
        try {
          const result = await mongoose.connection.collection('veefriendsGames').updateOne(
            { _id: game._id },
            { $set: { players: game.players } }
          );
          
          console.log(`  - Game updated: ${result.modifiedCount > 0 ? 'Success' : 'No changes'}`);
          if (result.modifiedCount > 0) {
            fixedGames++;
          }
        } catch (updateError) {
          console.error(`  - Error updating game:`, updateError);
          errorGames++;
        }
      }
    }
    
    console.log('\n=== Database Cleanup Summary ===');
    console.log(`Total games processed: ${games.length}`);
    console.log(`Games fixed: ${fixedGames}`);
    console.log(`Decks fixed: ${fixedDecks}`);
    console.log(`Games with errors: ${errorGames}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);
