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

// Define allowed origins based on environment
const allowedOrigins = [
  'https://vf.studioboost.pro',
  'http://vf.studioboost.pro',
  'https://veefriends.studioboost.pro',
  'http://veefriends.studioboost.pro',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:19000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
  'http://127.0.0.1:19000',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:*',
  'https://localhost:*'
];

// Setup Socket.IO with CORS and better connection settings
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(pattern => {
        return origin.match(new RegExp(pattern.replace('*', '.*')));
      })) {
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        // Still allow for debugging purposes in development
        if (process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ["my-custom-header", "Content-Type", "Authorization", "Access-Control-Allow-Origin"],
    exposedHeaders: ["Content-Length", "X-Requested-With"],
  },
  // Extremely permissive settings for troubleshooting
  pingTimeout: 300000, // 5 minute timeout
  pingInterval: 5000, // 5 second ping
  connectTimeout: 120000, // 2 minute connect timeout
  // Use only polling (most compatible)
  transports: ['polling'],
  // Better error handling and logging
  allowEIO3: true, // Support both Socket.IO v2 and v3 clients
  maxHttpBufferSize: 1e6, // 1MB buffer
  path: '/socket.io/', // Explicitly set path
  // Additional settings
  serveClient: false, // Don't serve client files
  cookie: false, // Disable cookies for better mobile compatibility
});

// Log socket server configuration with more details
console.log('Socket.IO server configured with:', {
  transports: ['polling'],
  pingTimeout: '300000ms',
  pingInterval: '5000ms',
  connectTimeout: '120000ms',
  cors: 'dynamic validation with allowed origins'
});

// Add a route specifically for socket.io connection testing
app.get('/socket-test', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cache-Control', 'no-store');
  res.status(200).send({
    status: 'socket-io-ready',
    timestamp: new Date().toISOString(),
    transports: ['polling'],
    allowedOrigins: allowedOrigins
  });
});

// Add debug logging for transport upgrades
io.engine.on("connection", (socket) => {
  console.log(`New connection ${socket.id} with transport: ${socket.transport.name}`);
  
  socket.transport.on("upgrade", (transport) => {
    console.log(`Connection ${socket.id} upgraded from ${socket.transport.name} to ${transport.name}`);
  });
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
