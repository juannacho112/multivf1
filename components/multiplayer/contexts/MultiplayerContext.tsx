import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import socketService from '../services/SocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for our context
type User = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  inGame?: boolean;
  isGuest?: boolean;
};

type GameInvite = {
  gameId: string;
  gameCode: string;
  hostId: string;
  hostUsername: string;
};

type MatchmakingStatus = {
  inQueue: boolean;
  queuePosition?: number;
  queueSize?: number;
  timeInQueue: number;
  startTime?: number;
};

// Veefriends game-specific types
type VeefriendsCard = {
  id: string;
  name: string;
  skill: number;
  stamina: number;
  aura: number;
  baseTotal: number;
  finalTotal: number;
  rarity: string;
  character: string;
  type?: string;
  unlocked: boolean;
};

type VeefriendsGameState = {
  gameId?: string;
  gameCode?: string;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  phase: 'draw' | 'challengerPick' | 'acceptDeny' | 'resolve' | 'gameOver';
  currentChallenger: 'player1' | 'player2';
  challengeAttribute: 'skill' | 'stamina' | 'aura' | 'total' | null;
  deniedAttributes: string[];
  availableAttributes: string[];
  cardsInPlay: {
    player1: VeefriendsCard | null;
    player2: VeefriendsCard | null;
  };
  burnPile: VeefriendsCard[];
  roundNumber: number;
  potSize: number;
  players: {
    userId: string;
    username: string;
    displayName?: string;
    isReady?: boolean;
    isGuest?: boolean;
    points: {
      skill: number;
      stamina: number;
      aura: number;
    };
    terrificTokenUsed: boolean;
    deck: VeefriendsCard[];
  }[];
  winner?: 'player1' | 'player2' | null;
};

interface MultiplayerContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
  onlineUsers: User[];
  gameInvites: GameInvite[];
  activeGame: VeefriendsGameState | null;
  matchmaking: MatchmakingStatus;
  
  // Connection methods
  connect: (asGuest?: boolean) => Promise<boolean>;
  disconnect: () => void;
  
  // Authentication methods
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Game methods
  createGame: (isPrivate?: boolean) => Promise<string | null>;
  joinGame: (gameId: string) => Promise<boolean>;
  joinGameByCode: (gameCode: string) => Promise<boolean>;
  setReady: (ready: boolean) => void;
  leaveGame: () => void;
  
  // Veefriends game actions
  drawCards: () => void;
  selectAttribute: (attribute: string, useTerrificToken?: boolean) => void;
  respondToChallenge: (accept: boolean) => void;
  resolveChallenge: () => void;
  sendGameChat: (message: string) => void;
  
  // Matchmaking methods
  joinMatchmaking: () => void;
  leaveMatchmaking: () => void;
  
  // Invite methods
  sendInvite: (userId: string) => Promise<boolean>;
  acceptInvite: (gameId: string) => Promise<boolean>;
  declineInvite: (gameId: string) => void;
}

// Create the context with a default value
const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

// Provider component
export const MultiplayerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [gameInvites, setGameInvites] = useState<GameInvite[]>([]);
  const [activeGame, setActiveGame] = useState<VeefriendsGameState | null>(null);
  const [matchmaking, setMatchmaking] = useState<MatchmakingStatus>({
    inQueue: false,
    timeInQueue: 0
  });
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setCurrentUser(JSON.parse(userData));
        setIsGuest(false);
        
        // Connect to socket server if authenticated
        console.log('MultiplayerContext: Found token, connecting with auth');
        socketService.connect(false); // false = regular auth, not guest
      }
    };
    
    // Check for saved auth on first load
    checkAuth();
    
    // Debug log to track component lifecycle
    console.log('MultiplayerContext mounted');
    
    // Clean up socket connection on unmount
    return () => {
      console.log('MultiplayerContext: Disconnecting socket on unmount');
      socketService.disconnect();
    };
  }, []);
  
  // Set up socket event listeners
  useEffect(() => {
    // Connection events
    const handleConnected = () => {
      console.log('MultiplayerContext: Socket connected event received');
      
      // Immediately update connected state with useEffect-safe state update
      setIsConnected(true);
      
      // Log the connection success
      console.log('MultiplayerContext: Connection status updated to CONNECTED');
      
      // If connecting as guest, set authenticated state and create guest user object
      if (isGuest) {
        console.log('MultiplayerContext: Setting up guest user after connection');
        
        // Generate a random guest username
        const guestNumber = Math.floor(1000 + Math.random() * 9000);
        const guestUsername = `Guest_${guestNumber}`;
        const guestId = `guest-${Math.random().toString(36).substring(2, 9)}`;
        
        const guestUser: User = {
          id: guestId,
          username: guestUsername,
          displayName: guestUsername,
          isGuest: true
        };
        
        console.log('MultiplayerContext: Created guest user:', guestUser);
        
        // Set the user and authentication in state in a safe way for React's state batching
        setCurrentUser(guestUser);
        setIsAuthenticated(true);
        
        // Force state debugging with a timeout for reliable logging
        setTimeout(() => {
          console.log('MultiplayerContext: State after guest setup:', {
            isConnected: true,
            isAuthenticated: true,
            user: guestUser
          });
        }, 250);

        // Important: Notify the server about this guest user
        socketService.sendToServer('guest:register', {
          userId: guestId,
          username: guestUsername,
          displayName: guestUsername
        });
      } else {
        // For regular users, request updated user data to ensure we have the latest
        socketService.sendToServer('user:getProfile');
      }
    };
    
    const handleDisconnected = () => {
      setIsConnected(false);
    };
    
    // User and invite events
    const handleUsersList = (data: { users: User[] }) => {
      setOnlineUsers(data.users);
    };
    
    const handleGameInvite = (invite: GameInvite) => {
      setGameInvites(prev => [...prev, invite]);
    };
    
    // Matchmaking events
    const handleMatchmakingJoined = (data: { position: number, queueSize: number }) => {
      setMatchmaking({
        inQueue: true,
        queuePosition: data.position,
        queueSize: data.queueSize,
        timeInQueue: 0,
        startTime: Date.now()
      });
    };
    
    const handleMatchmakingLeft = () => {
      setMatchmaking({
        inQueue: false,
        timeInQueue: 0
      });
    };
    
    const handleMatchmakingMatched = (data: { gameId: string, opponent: User }) => {
      setMatchmaking({
        inQueue: false,
        timeInQueue: 0
      });
      
      // The game state will be updated through the game:created event
    };
    
    // Game events
    const handleGameCreated = (data: { gameId: string, gameCode: string, players: any[] }) => {
      setActiveGame({
        gameId: data.gameId,
        gameCode: data.gameCode,
        status: 'waiting',
        phase: 'draw',
        players: data.players,
        currentChallenger: 'player1',
        challengeAttribute: null,
        deniedAttributes: [],
        availableAttributes: ['skill', 'stamina', 'aura'],
        cardsInPlay: {
          player1: null,
          player2: null
        },
        burnPile: [],
        roundNumber: 1,
        potSize: 1,
        winner: null
      });
    };
    
    const handleGamePlayerJoined = (data: { gameId: string, player: any, players: any[] }) => {
      setActiveGame(prev => {
        if (!prev || prev.gameId !== data.gameId) return prev;
        
        return {
          ...prev,
          players: data.players
        };
      });
    };
    
    const handleGameReady = (data: { gameId: string, players: any[] }) => {
      setActiveGame(prev => {
        if (!prev || prev.gameId !== data.gameId) return prev;
        
        return {
          ...prev,
          players: data.players
        };
      });
    };
    
    const handleGamePlayerReady = (data: { gameId: string, userId: string, username: string, allReady: boolean }) => {
      setActiveGame(prev => {
        if (!prev || prev.gameId !== data.gameId) return prev;
        
        return {
          ...prev,
          players: prev.players.map(player => {
            if (player.userId === data.userId) {
              return { ...player, isReady: true };
            }
            return player;
          })
        };
      });
    };
    
    const handleGameStarted = (data: { gameId: string, gameState: any }) => {
      setActiveGame(data.gameState);
    };
    
    const handleGameStateUpdate = (data: { gameId: string, gameState: any }) => {
      if (data.gameState) {
        setActiveGame(data.gameState);
      }
    };
    
    const handleGameActionResult = (data: { gameId: string, action: string, result: any }) => {
      if (data.result.gameStateChanged && data.result.gameState) {
        setActiveGame(data.result.gameState);
      }
    };
    
    const handleGameEnded = (data: { gameId: string, winner: 'player1' | 'player2' | null, gameState: any }) => {
      if (data.gameState) {
        setActiveGame(data.gameState);
      } else {
        setActiveGame(prev => {
          if (!prev || prev.gameId !== data.gameId) return prev;
          
          return {
            ...prev,
            status: 'completed',
            phase: 'gameOver',
            winner: data.winner as 'player1' | 'player2' | null
          };
        });
      }
    };
    
    const handleGamePlayerLeft = (data: { gameId: string, userId: string, username: string, isGuest: boolean, status: 'waiting' | 'abandoned' }) => {
      setActiveGame(prev => {
        if (!prev || prev.gameId !== data.gameId) return prev;
        
        if (data.status === 'abandoned') {
          return {
            ...prev,
            status: 'abandoned'
          };
        }
        
        // If in waiting state, just remove the player
        return {
          ...prev,
          players: prev.players.filter(p => {
            if (data.isGuest) {
              return p.username !== data.username;
            } else {
              return p.userId !== data.userId;
            }
          })
        };
      });
    };
    
    // Set up listeners
    socketService.listenToServer('connected', handleConnected);
    socketService.listenToServer('disconnected', handleDisconnected);
    socketService.listenToServer('users:list', handleUsersList);
    socketService.listenToServer('game:invite', handleGameInvite);
    socketService.listenToServer('matchmaking:joined', handleMatchmakingJoined);
    socketService.listenToServer('matchmaking:left', handleMatchmakingLeft);
    socketService.listenToServer('matchmaking:matched', handleMatchmakingMatched);
    socketService.listenToServer('game:created', handleGameCreated);
    socketService.listenToServer('game:playerJoined', handleGamePlayerJoined);
    socketService.listenToServer('game:ready', handleGameReady);
    socketService.listenToServer('game:playerReady', handleGamePlayerReady);
    socketService.listenToServer('game:started', handleGameStarted);
    socketService.listenToServer('game:stateUpdate', handleGameStateUpdate);
    socketService.listenToServer('game:actionResult', handleGameActionResult);
    socketService.listenToServer('game:ended', handleGameEnded);
    socketService.listenToServer('game:playerLeft', handleGamePlayerLeft);
    
    // Clean up listeners
    return () => {
      socketService.stopListeningToServer('connected', handleConnected);
      socketService.stopListeningToServer('disconnected', handleDisconnected);
      socketService.stopListeningToServer('users:list', handleUsersList);
      socketService.stopListeningToServer('game:invite', handleGameInvite);
      socketService.stopListeningToServer('matchmaking:joined', handleMatchmakingJoined);
      socketService.stopListeningToServer('matchmaking:left', handleMatchmakingLeft);
      socketService.stopListeningToServer('matchmaking:matched', handleMatchmakingMatched);
      socketService.stopListeningToServer('game:created', handleGameCreated);
      socketService.stopListeningToServer('game:playerJoined', handleGamePlayerJoined);
      socketService.stopListeningToServer('game:ready', handleGameReady);
      socketService.stopListeningToServer('game:playerReady', handleGamePlayerReady);
      socketService.stopListeningToServer('game:started', handleGameStarted);
      socketService.stopListeningToServer('game:stateUpdate', handleGameStateUpdate);
      socketService.stopListeningToServer('game:actionResult', handleGameActionResult);
      socketService.stopListeningToServer('game:ended', handleGameEnded);
      socketService.stopListeningToServer('game:playerLeft', handleGamePlayerLeft);
    };
  }, [isGuest]);
  
  // Update matchmaking time counter
  useEffect(() => {
    if (matchmaking.inQueue && matchmaking.startTime) {
      const interval = setInterval(() => {
        setMatchmaking(prev => ({
          ...prev,
          timeInQueue: Math.floor((Date.now() - (prev.startTime || 0)) / 1000)
        }));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [matchmaking.inQueue, matchmaking.startTime]);
  
  /**
   * Connect to the socket server
   */
  const connect = async (asGuest: boolean = false) => {
    console.log(`MultiplayerContext: Connecting as ${asGuest ? 'guest' : 'authenticated user'}`);
    setIsGuest(asGuest);
    
    // If we're connecting as a guest, immediately set that we're in guest mode
    // This helps the socket event listeners know to create a guest user on connection
    if (asGuest) {
      console.log('MultiplayerContext: Setting guest mode before connection');
    }
    
    // Connect and return result
    const result = await socketService.connect(asGuest);
    console.log(`MultiplayerContext: Connection result: ${result}`);
    return result;
  };
  
  /**
   * Disconnect from the socket server
   */
  const disconnect = () => {
    socketService.disconnect();
    
    if (isGuest) {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };
  
  /**
   * Log in a user
   */
  const login = async (username: string, password: string) => {
    try {
      // Use the same server URL as the socket connection
      const apiBaseUrl = socketService.getServerUrl();
      console.log(`Login: Using API base URL ${apiBaseUrl}`);
      
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store the token
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        // Update state immediately
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setIsGuest(false);
        
        // Disconnect any existing connection first
        socketService.disconnect();
        
        // Force a small delay before connection to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Connect to socket with retries
        let connectionSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          console.log(`Login: Socket connection attempt ${attempt}/3`);
          connectionSuccess = await socketService.connect(false); // Connect with token, not as guest
          
          if (connectionSuccess) {
            console.log('Login: Socket connection successful');
            break;
          } else {
            console.warn(`Login: Socket connection attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
          }
        }
        
        // Return successful even if socket failed - we'll handle reconnection in the components
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  /**
   * Register a new user
   */
  const register = async (username: string, email: string, password: string) => {
    try {
      // Use the same server URL as the socket connection
      const apiBaseUrl = socketService.getServerUrl();
      console.log(`Register: Using API base URL ${apiBaseUrl}`);
      
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Auto login after registration
        return await login(username, password);
      } else {
        console.error('Registration failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };
  
  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      // Disconnect socket
      socketService.disconnect();
      
      // Clear credentials
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      // Update state
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveGame(null);
      setGameInvites([]);
      setMatchmaking({ inQueue: false, timeInQueue: 0 });
      setIsGuest(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  /**
   * Create a new game
   */
  const createGame = async (isPrivate: boolean = false) => {
    try {
      socketService.sendToServer('game:create', { isPrivate });
      
      // Return will be handled via socket event
      return null;
    } catch (error) {
      console.error('Create game error:', error);
      return null;
    }
  };
  
  /**
   * Join an existing game by ID
   */
  const joinGame = async (gameId: string) => {
    try {
      socketService.sendToServer('game:join', { gameId });
      return true;
    } catch (error) {
      console.error('Join game error:', error);
      return false;
    }
  };
  
  /**
   * Join a game using a game code
   */
  const joinGameByCode = async (gameCode: string) => {
    try {
      socketService.sendToServer('game:joinByCode', { gameCode });
      return true;
    } catch (error) {
      console.error('Join game by code error:', error);
      return false;
    }
  };
  
  /**
   * Mark the player as ready
   */
  const setReady = (ready: boolean) => {
    if (!activeGame?.gameId) return;
    
    socketService.sendToServer('game:ready', {
      gameId: activeGame.gameId,
      ready
    });
  };
  
  /**
   * Leave the current game
   */
  const leaveGame = () => {
    setActiveGame(null);
    // Server will handle disconnect automatically
  };
  
  /**
   * Play a card from hand to field
   */
  const playCard = (cardId: string) => {
    if (!activeGame?.gameId) return;
    
    console.log(`Playing card ${cardId}`);
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'playCard',
      payload: { cardId }
    });
  };
  
  /**
   * Use a card ability
   */
  const useAbility = (sourceCardId: string, abilityId: string, targetCardId?: string) => {
    if (!activeGame?.gameId) return;
    
    console.log(`Using ability ${abilityId} on card ${sourceCardId} targeting ${targetCardId || 'none'}`);
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'useAbility',
      payload: { sourceCardId, abilityId, targetCardId }
    });
  };
  
  /**
   * End the current turn
   */
  const endTurn = () => {
    if (!activeGame?.gameId) return;
    
    console.log('Ending turn');
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'endTurn',
      payload: {}
    });
  };
  
  /**
   * Draw cards (Veefriends specific)
   */
  const drawCards = () => {
    if (!activeGame?.gameId) return;
    
    console.log('Drawing cards');
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'drawCards',
      payload: {}
    });
  };
  
  /**
   * Select attribute for challenge (Veefriends specific)
   */
  const selectAttribute = (attribute: string, useTerrificToken?: boolean) => {
    if (!activeGame?.gameId) return;
    
    console.log(`Selecting attribute: ${attribute}, terrific token: ${useTerrificToken ? 'yes' : 'no'}`);
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'selectAttribute',
      payload: { attribute, useTerrificToken }
    });
  };
  
  /**
   * Respond to a challenge (Veefriends specific)
   */
  const respondToChallenge = (accept: boolean) => {
    if (!activeGame?.gameId) return;
    
    console.log(`Responding to challenge: ${accept ? 'accept' : 'deny'}`);
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'respondToChallenge',
      payload: { accept }
    });
  };
  
  /**
   * Resolve a challenge (Veefriends specific)
   */
  const resolveChallenge = () => {
    if (!activeGame?.gameId) return;
    
    console.log('Resolving challenge');
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'resolveChallenge',
      payload: {}
    });
  };
  
  /**
   * Send a chat message in game
   */
  const sendGameChat = (message: string) => {
    if (!activeGame?.gameId) return;
    
    socketService.sendToServer('game:action', {
      gameId: activeGame.gameId,
      action: 'chat',
      payload: { message }
    });
  };
  
  /**
   * Join matchmaking queue
   */
  const joinMatchmaking = () => {
    socketService.sendToServer('matchmaking:join');
  };
  
  /**
   * Leave matchmaking queue
   */
  const leaveMatchmaking = () => {
    socketService.sendToServer('matchmaking:leave');
  };
  
  /**
   * Send a game invite to another user
   */
  const sendInvite = async (userId: string) => {
    try {
      // First create a game
      socketService.sendToServer('game:create', { isPrivate: true });
      
      // The game:created event will fire, then we send the invite
      // This is a simplification - in a real app, you'd track the created game and then send the invite
      return true;
    } catch (error) {
      console.error('Send invite error:', error);
      return false;
    }
  };
  
  /**
   * Accept a game invite
   */
  const acceptInvite = async (gameId: string) => {
    try {
      // Remove the invite from state
      setGameInvites(prev => prev.filter(invite => invite.gameId !== gameId));
      
      // Join the game
      return await joinGame(gameId);
    } catch (error) {
      console.error('Accept invite error:', error);
      return false;
    }
  };
  
  /**
   * Decline a game invite
   */
  const declineInvite = (gameId: string) => {
    setGameInvites(prev => prev.filter(invite => invite.gameId !== gameId));
  };
  
  const contextValue = {
    isConnected,
    isAuthenticated,
    currentUser,
    onlineUsers,
    gameInvites,
    activeGame,
    matchmaking,
    
    connect,
    disconnect,
    login,
    register,
    logout,
    createGame,
    joinGame,
    joinGameByCode,
    setReady,
    leaveGame,
    drawCards,
    selectAttribute,
    respondToChallenge,
    resolveChallenge,
    sendGameChat,
    joinMatchmaking,
    leaveMatchmaking,
    sendInvite,
    acceptInvite,
    declineInvite
  };
  
  return (
    <MultiplayerContext.Provider value={contextValue}>
      {children}
    </MultiplayerContext.Provider>
  );
};

// Custom hook for using the multiplayer context
export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};
