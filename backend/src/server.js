import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import routes from './routes/index.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS and better connection settings
const io = new Server(server, {
  cors: {
    // Allow any origin to connect
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ["my-custom-header", "Content-Type", "Authorization"]
  },
  // Improve connection reliability
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  // Enable polling first then upgrade to WebSocket - better for mobile and problematic networks
  transports: ['polling', 'websocket'],
  // Better error handling and logging
  allowEIO3: true, // Support both Socket.IO v2 and v3 clients
  maxHttpBufferSize: 1e8, // 100MB for larger payloads
});

// Log socket server configuration
console.log('Socket.IO server configured with:', {
  transports: ['polling', 'websocket'],
  pingTimeout: '60000ms',
  pingInterval: '25000ms'
});

// Set up access control headers for express
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, my-custom-header');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Debug socket connections
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err.req);      // the request object
  console.log("Connection error code:", err.code);     // the error code, for example 1
  console.log("Connection error message:", err.message);  // the error message, for example "Session ID unknown"
  console.log("Connection error context:", err.context);  // some additional error context
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    version: '1.0.0',
    game: 'VeeFriends Multiplayer'
  });
});

// Documentation route
app.get('/info', (req, res) => {
  res.status(200).json({
    name: 'VeeFriends Card Game API',
    description: 'Backend server for VeeFriends online multiplayer card game',
    endpoints: [
      { path: '/api/auth', description: 'Authentication endpoints' },
      { path: '/api/games', description: 'Game management endpoints' },
      { path: '/api/users', description: 'User management endpoints' },
      { path: '/health', description: 'Server health check' },
      { path: '/info', description: 'API documentation' }
    ],
    socket_events: {
      game: 'VeeFriends real-time gameplay with skill, stamina, and aura attributes'
    },
    version: '1.0.0'
  });
});

// Handle Socket.IO connections
// NOTE: We're primarily using veefriendsSocketService.js as our main game service
// The legacy socketService is kept for reference but will be deprecated
import setupVeefriendsSocketIO from './services/veefriendsSocketService.js';

// Set up Veefriends game socket service
console.log('Setting up VeeFriends game socket service...');
setupVeefriendsSocketIO(io);

// Connect to MongoDB
import connectDB from './config/dbConfig.js';
connectDB()
  .then((connection) => {
    if (connection) {
      console.log('Successfully connected to MongoDB');
    } else {
      console.warn('MongoDB connection failed, but server will continue to run with limited functionality');
      console.warn('Guest access will still work, but user accounts will not be available');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.warn('Server will continue to run with limited functionality');
    console.warn('Guest access will still work, but user accounts will not be available');
  });

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- API Documentation: http://localhost:${PORT}/info`);
  console.log(`- Health Check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received');
  console.log('Closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    if (mongoose.connection.readyState !== 0) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

export default server;
