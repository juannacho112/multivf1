import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Connect to MongoDB database
 * @returns {Promise} MongoDB connection promise
 */
const connectDB = async () => {
  try {
    // Get MongoDB connection details from environment variables with fallbacks
    const mongoHost = process.env.MONGODB_HOST || 'localhost';
    const mongoPort = process.env.MONGODB_PORT || '27017';
    const mongoDatabase = process.env.MONGODB_DATABASE || 'tcg-game';
    const mongoUser = process.env.MONGODB_USER;
    const mongoPassword = process.env.MONGODB_PASSWORD;
    const mongoAuthSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
    
    // Build the connection URI based on whether authentication is provided
    let dbURI;
    if (mongoUser && mongoPassword) {
      dbURI = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${mongoAuthSource}`;
      console.log(`Using authenticated MongoDB connection to ${mongoHost}:${mongoPort}/${mongoDatabase}`);
    } else {
      dbURI = `mongodb://${mongoHost}:${mongoPort}/${mongoDatabase}`;
      console.log(`Using non-authenticated MongoDB connection to ${mongoHost}:${mongoPort}/${mongoDatabase}`);
    }
    
    // Use MONGODB_URI if explicitly provided (overrides individual settings)
    if (process.env.MONGODB_URI) {
      dbURI = process.env.MONGODB_URI;
      console.log('Using MongoDB connection string from MONGODB_URI');
    }
    
    // MongoDB connection options
    const options = {
      connectTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      serverSelectionTimeoutMS: 10000, // 10 seconds
      // Auth is handled in the connection string above
    };
    
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(dbURI, options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Check if an admin user exists, and create one if it doesn't
    await createAdminUserIfNeeded();
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Please ensure MongoDB is running and accessible.');
    console.error('Detailed error:', error);
    
    // In production, you might want to exit - in development, better to continue with error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // Return null to indicate failed connection
    return null;
  }
};

/**
 * Create an admin user if no users exist in the database
 * This ensures there's always a user that can log in
 */
const createAdminUserIfNeeded = async () => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('No users found in database. Creating default admin user...');
      
      // Create a default admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // This will be hashed by the User model pre-save hook
        displayName: 'Administrator',
        role: 'admin',
        isOnline: false
      });
      
      await adminUser.save();
      console.log('Default admin user created with username: admin, password: admin123');
    }
  } catch (error) {
    console.error('Failed to create default admin user:', error);
  }
};

export default connectDB;
