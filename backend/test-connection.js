// Simple MongoDB connection test for VeeFriends game
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veefriends-game';

// Function to test MongoDB connection
async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log(`Connection string: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Check for VeefriendsGame collection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasVeefriendsGameCollection = collections.some(c => c.name === 'veefriendsGames');
    
    if (hasVeefriendsGameCollection) {
      console.log('✅ Found VeefriendsGame collection');
      
      // Count documents
      const count = await db.collection('veefriendsGames').countDocuments();
      console.log(`🔢 Collection has ${count} games`);
      
      if (count > 0) {
        // Check the most recent game
        const latestGames = await db.collection('veefriendsGames').find({})
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();
          
        if (latestGames.length > 0) {
          const game = latestGames[0];
          console.log(`🎮 Latest game ID: ${game._id}`);
          console.log(`🕒 Created at: ${new Date(game.createdAt).toLocaleString()}`);
          console.log(`👥 Players: ${game.players?.length || 0}`);
          console.log(`🃏 Player 1 deck: ${game.players?.[0]?.deck?.length || 0} cards`);
          console.log(`🃏 Player 2 deck: ${game.players?.[1]?.deck?.length || 0} cards`);
          console.log(`📊 Game status: ${game.status}`);
        }
      }
    } else {
      console.log('⚠️ VeefriendsGame collection not found. Run init-veefriends-db.js to create it.');
    }
    
    console.log('\nTest complete. You can now run the server.');
    
  } catch (error) {
    console.error('❌ Connection error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the test
testConnection().then(() => process.exit(0));
