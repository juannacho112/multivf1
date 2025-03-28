import { io, Socket } from 'socket.io-client';
// @ts-ignore - Handle missing type declarations
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - Handle missing type declarations
import { EventEmitter } from 'events';
// @ts-ignore - Handle missing type declarations
import { Platform } from 'react-native';

// Production URL - Server should be running at this domain
const PRODUCTION_URL = 'https://vf.studioboost.pro'; 

// Fallback development URLs in priority order
const DEV_URLS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.0.2.2:3000', // Android emulator special case for localhost
];

// Default to production URL
let DEFAULT_SERVER_URL = PRODUCTION_URL;

// For simplicity, assume production by default
// This can be overridden during connection attempts if needed
const IS_DEV = false;

// In development mode, use development URLs
if (IS_DEV && Platform.OS) {
  DEFAULT_SERVER_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

// Creating our own simple event emitter to avoid TS issues
class SimpleEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  public emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.length === 0) return false;
    
    eventListeners.forEach(listener => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`Error in ${event} event listener:`, err);
      }
    });
    return true;
  }

  public on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  public once(event: string, listener: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  public off(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) return this;
    
    const eventListeners = this.listeners.get(event)!;
    const index = eventListeners.indexOf(listener);
    
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }
    return this;
  }

  public setMaxListeners(n: number): this {
    // This is a no-op for our simple implementation
    return this;
  }
}

class SocketService extends SimpleEventEmitter {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private serverUrl: string = DEFAULT_SERVER_URL;
  
  constructor() {
    super();
    // No need for setMaxListeners with our custom event emitter
    this.setMaxListeners(20);
    
    // Try to load previously successful URL
    this.loadSavedServerUrl();
  }
  
  /**
   * Load any previously saved server URL from storage
   */
  private async loadSavedServerUrl(): Promise<void> {
    try {
      const savedUrl = await AsyncStorage.getItem('lastSuccessfulServerURL');
      if (savedUrl) {
        console.log(`Loaded saved server URL: ${savedUrl}`);
        this.serverUrl = savedUrl;
      }
    } catch (error) {
      console.warn('Failed to load saved server URL:', error);
    }
  }
  
  /**
   * Save successful server URL to storage
   */
  private async saveServerUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem('lastSuccessfulServerURL', url);
      console.log(`Saved successful server URL: ${url}`);
    } catch (error) {
      console.warn('Failed to save server URL:', error);
    }
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
      
      // Try to connect with current URL first
      console.log(`Attempting to connect to primary server: ${this.serverUrl}`);
      const connected = await this.initializeSocket(this.serverUrl, auth);
      
      if (connected) {
        return true;
      }
      
      // If production URL failed and we're in development, try fallback URLs
      if (IS_DEV && this.serverUrl === PRODUCTION_URL) {
        for (const url of DEV_URLS) {
          console.log(`Attempting to connect to fallback server: ${url}`);
          const fallbackConnected = await this.initializeSocket(url, auth);
          if (fallbackConnected) {
            this.serverUrl = url;
            await this.saveServerUrl(url);
            return true;
          }
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
   * Initialize the socket with the given URL and auth data
   */
  private async initializeSocket(serverUrl: string, auth: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      console.log(`Connecting to ${serverUrl} with ${auth.isGuest ? 'guest' : 'token'} auth`);
      
      // Initialize socket with improved settings that match the backend
      this.socket = io(serverUrl, {
        auth,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        // Use both polling and websocket transport for better compatibility
        transports: ['polling', 'websocket'],
        upgrade: true,
        path: '/socket.io/',
      });
      
      console.log('Socket configured with both polling and WebSocket transport');
      
      // Set up standard event listeners
      this.setupEventListeners();
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket && !this.isConnected) {
          console.log('Connection attempt timed out');
          this.socket.disconnect();
          this.socket = null;
          resolve(false);
        }
      }, 10000); // 10 second connection timeout
      
      // Handle successful connection
      const onConnect = () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log(`Socket connected successfully to ${serverUrl}!`);
        
        // Save successful URL
        this.saveServerUrl(serverUrl);
        
        // Log transport type
        if (this.socket) {
          const transport = this.socket.io.engine.transport.name;
          console.log(`Active transport: ${transport}`);
          
          // Listen for transport upgrade
          this.socket.io.engine.on("upgrade", (transport: any) => {
            console.log(`Transport upgraded to ${transport.name}`);
          });
        }
        
        this.emit('connected');
        resolve(true);
      };
      
      // Handle connection error
      const onConnectError = (error: Error) => {
        clearTimeout(connectionTimeout);
        console.error(`Socket connection error: ${error.message}`);
        
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        
        resolve(false);
      };
      
      // Add temporary listeners
      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onConnectError);
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
   * Get the current transport being used (polling or websocket)
   */
  getCurrentTransport(): string | null {
    if (!this.socket || !this.socket.io || !this.socket.io.engine) {
      return null;
    }
    return this.socket.io.engine.transport.name;
  }
  
  /**
   * Get the current server URL being used
   */
  getServerUrl(): string {
    return this.serverUrl;
  }
  
  /**
   * Emit an event to the server with improved error handling
   * @param event Event name
   * @param data Event data
   */
  sendToServer(event: string, data?: any): boolean {
    if (this.socket && this.isConnected) {
      try {
        this.socket.emit(event, data);
        return true;
      } catch (error) {
        console.error(`Error sending event '${event}':`, error);
        return false;
      }
    } else if (event !== 'disconnected') {
      console.warn(`Cannot emit '${event}'. Socket not connected.`);
    }
    return false;
  }
  
  /**
   * Add listener for a socket event from server
   * @param event Event to listen for
   * @param callback Callback function
   */
  listenToServer(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Queue this listener to be added when socket connects
      this.once('connected', () => {
        if (this.socket) {
          this.socket.on(event, callback);
        }
      });
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
      
      // Only attempt automatic reconnection for transient errors
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Don't attempt to reconnect - explicit disconnect
        console.log('Explicit disconnect, not attempting reconnection');
      }
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
    
    // Listen for explicit errors from server
    this.socket.on('error', (errorData: any) => {
      console.error('Server sent error:', errorData);
      
      // Emit error event with the message
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.message || 'Unknown error';
        
      this.emit('server_error', errorMessage);
    });
    
    // Listen for auth errors
    this.socket.on('auth_error', (errorData: any) => {
      console.error('Authentication error:', errorData);
      this.emit('auth_error', errorData);
    });
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;
