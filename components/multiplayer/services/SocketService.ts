import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';
import { Platform } from 'react-native';

// Server URL - Using IP address instead of localhost for cross-device testing
// Trying multiple connection URLs to improve connection reliability
// The first one that works will be used
const SERVER_URLS = [
  'https://vf.studioboost.pro', // Production server URL with HTTPS
  'https://vf.studioboost.pro:3000', // Production server with explicit port
  'http://vf.studioboost.pro', // Production server with HTTP fallback
  '//', // Same-origin relative URL - this often works best when frontend and backend are on same domain
  'http://localhost:3000', // Works with web browser on same machine
  'http://127.0.0.1:3000', // Alternative localhost
  'http://10.0.2.2:3000', // Android emulator special case for localhost
];

// Force production URL when in production
if (process.env.NODE_ENV === 'production') {
  // In production, prioritize same-origin connections
  SERVER_URLS.unshift('//');
}

// Platform-specific default server URL
let SERVER_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Attempt to retrieve last successful server URL from storage
const getLastSuccessfulURL = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('lastSuccessfulServerURL');
  } catch {
    return null;
  }
};

// Save last successful server URL to storage
const saveLastSuccessfulURL = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('lastSuccessfulServerURL', url);
  } catch {
    // Ignore errors storing the URL
  }
};

// Try to load the last successful URL on import
getLastSuccessfulURL().then(url => {
  if (url) SERVER_URL = url;
});

class SocketService extends EventEmitter {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // ms
  
  constructor() {
    super();
    // Increase event listener limit to avoid memory leak warnings
    this.setMaxListeners(20);
  }
  
  /**
   * Initialize and connect the socket
   * @param asGuest Connect as a guest user without authentication
   */
  async connect(asGuest: boolean = false): Promise<boolean> {
    try {
      // Close existing connection if any
      if (this.socket) {
        console.log('Closing existing socket connection');
        this.socket.disconnect();
        this.socket = null;
      }
      
      // Prepare auth object
      let auth: any = {};
      
      if (asGuest) {
        // Connect as guest
        auth = { isGuest: true };
        console.log('Using guest authentication');
      } else {
        // Connect with authentication token
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          console.error('No auth token found. User must be logged in or connect as guest.');
          return false;
        }
        
        console.log('Using token authentication');
        auth = { token };
      }
      
      // Try each server URL until one works
      for (const url of SERVER_URLS) {
        console.log(`Attempting to connect to server: ${url} as ${asGuest ? 'guest' : 'authenticated user'}`);
        
        try {
          const connected = await this.tryConnect(url, auth);
          if (connected) {
            SERVER_URL = url; // Save the working URL for future use
            console.log(`Successfully connected to ${url}`);
            return true;
          }
        } catch (error) {
          console.error(`Failed to connect to ${url}:`, error);
          // Continue to the next URL
        }
      }
      
      console.error('Failed to connect to any server URL');
      return false;
    } catch (error) {
      console.error('Socket connection error:', error);
      return false;
    }
  }
  
  /**
   * Try to connect to a specific server URL
   * @param serverUrl The server URL to try
   * @param auth The authentication object
   * @returns Promise that resolves to true if connected successfully, false otherwise
   */
  private async tryConnect(serverUrl: string, auth: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      console.log(`Attempting to connect to ${serverUrl} with auth:`, 
        auth.isGuest ? 'Guest auth' : 'Token auth');
      
      // Initialize socket with auth data - match backend settings
      this.socket = io(serverUrl, {
        auth,
        reconnection: true,
        reconnectionAttempts: Infinity, // Unlimited reconnection attempts
        reconnectionDelay: 1000, // Start with a 1-second delay
        reconnectionDelayMax: 10000, // Max 10 seconds between attempts
        timeout: 60000, // Match backend timeout (60 seconds)
        transports: ['polling'], // Use only polling initially for maximum compatibility
        forceNew: true, // Force new connection
        path: '/socket.io/', // Explicitly set path to match backend
      });
      
      console.log('Socket configured with polling-only transport for better compatibility');
      
      // Set up standard event listeners
      this.setupEventListeners();
      
      // Set up special listeners just for this connection attempt
      const onConnect = () => {
        console.log(`Socket connected successfully to ${serverUrl}!`);
        this.isConnected = true;
        this.emit('connected');
        
        // Save successful URL for future use
        saveLastSuccessfulURL(serverUrl)
          .then(() => console.log(`Saved successful server URL: ${serverUrl}`))
          .catch(() => console.warn('Failed to save server URL'));
          
        resolve(true);
      };
      
      const onConnectError = (error: Error) => {
        console.error(`Socket connection error to ${serverUrl}:`, error.message);
        
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        
        resolve(false);
      };
      
      const onTimeout = () => {
        console.error(`Socket connection timeout to ${serverUrl}`);
        
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        
        resolve(false);
      };
      
      // Add temporary listeners
      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onConnectError);
      
      // Set a timeout in case the connection hangs
      const timeoutId = setTimeout(() => {
        if (this.socket) {
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onConnectError);
          onTimeout();
        }
      }, 5000);
      
      // Clean up timeout if we connect successfully
      this.socket.once('connect', () => {
        clearTimeout(timeoutId);
      });
    });
  }
  
  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.emit('disconnected');
      console.log('Socket disconnected');
    }
  }
  
  /**
   * Check if the socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null;
  }
  
  /**
   * Emit an event to the server
   * @param event Event name
   * @param data Event data
   */
  sendToServer(event: string, data?: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else if (event !== 'disconnected') {
      console.warn(`Cannot emit '${event}'. Socket not connected.`);
    }
  }
  
  /**
   * Add listener for a socket event from server
   * @param event Event to listen for
   * @param callback Callback function
   */
  listenToServer(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    return this; // Return this for method chaining
  }
  
  /**
   * Remove listener for a socket event from server
   * @param event Event to stop listening for
   * @param callback Callback function to remove
   */
  stopListeningToServer(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    return this; // Return this for method chaining
  }
  
  /**
   * Set up internal event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected!');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('error', error);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;
