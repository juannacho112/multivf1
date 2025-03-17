import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { MapObject, processMapObjects, getNextPosition } from '../utils/mapUtils';

// Define types
export type Direction = 'up' | 'down' | 'left' | 'right';

interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  speed: number;
  unlockedCards: string[]; // IDs of cards the player has unlocked
  achievements: string[]; // IDs of achievements the player has earned
}

interface MapState {
  width: number;
  height: number;
  layers: any[];
  tileWidth: number;
  tileHeight: number;
  viewportX: number;
  viewportY: number;
  interactiveObjects: MapObject[];
  collisionLayers: string[]; // IDs of layers with collision
  mapReady: boolean;
}

interface InteractionState {
  nearbyObject: MapObject | null;
  isDialogActive: boolean;
  dialogText: string;
  dialogSpeaker: string | null;
  isBattleActive: boolean;
}

interface UiState {
  screenWidth: number;
  screenHeight: number;
}

interface ExploreState {
  player: PlayerState;
  map: MapState;
  interaction: InteractionState;
  ui: UiState;
}

// Actions
type Action =
  | { type: 'MOVE_PLAYER'; direction: Direction }
  | { type: 'SET_MAP_DATA'; mapData: any }
  | { type: 'SET_VIEWPORT'; x: number; y: number }
  | { type: 'SET_NEARBY_OBJECT'; object: MapObject | null }
  | { type: 'START_DIALOG'; text: string; speaker?: string | null }
  | { type: 'END_DIALOG' }
  | { type: 'START_BATTLE' }
  | { type: 'END_BATTLE' }
  | { type: 'SET_SCREEN_SIZE'; width: number; height: number };

// Initial state
const initialDimensions = Dimensions.get('window');

const initialState: ExploreState = {
  player: {
    x: 100, // Starting X position
    y: 100, // Starting Y position
    direction: 'down',
    isMoving: false,
    speed: 16, // Pixels per step
    unlockedCards: [],
    achievements: [],
  },
  map: {
    width: 800, // Default map width
    height: 600, // Default map height
    layers: [],
    tileWidth: 32,
    tileHeight: 32,
    viewportX: 0,
    viewportY: 0,
    interactiveObjects: [],
    collisionLayers: [],
    mapReady: false,
  },
  interaction: {
    nearbyObject: null,
    isDialogActive: false,
    dialogText: '',
    dialogSpeaker: null,
    isBattleActive: false,
  },
  ui: {
    screenWidth: initialDimensions.width,
    screenHeight: initialDimensions.height,
  },
};

// Create context
const ExploreContext = createContext<{
  state: ExploreState;
  movePlayer: (direction: Direction) => void;
  setMapData: (mapData: any) => void;
  setViewport: (x: number, y: number) => void;
  setNearbyObject: (object: MapObject | null) => void;
  startDialog: (text: string, speaker?: string) => void;
  endDialog: () => void;
  startBattle: () => void;
  endBattle: () => void;
  setScreenSize: (width: number, height: number) => void;
}>({
  state: initialState,
  movePlayer: () => {},
  setMapData: () => {},
  setViewport: () => {},
  setNearbyObject: () => {},
  startDialog: () => {},
  endDialog: () => {},
  startBattle: () => {},
  endBattle: () => {},
  setScreenSize: () => {},
});

// Reducer function
function exploreReducer(state: ExploreState, action: Action): ExploreState {
  switch (action.type) {
    case 'MOVE_PLAYER':
      const newPosition = getNextPosition(
        state.player.x,
        state.player.y,
        action.direction,
        state.player.speed
      );
      return {
        ...state,
        player: {
          ...state.player,
          x: newPosition.x,
          y: newPosition.y,
          direction: action.direction,
          isMoving: true,
        },
      };
      
    case 'SET_MAP_DATA':
      const mapWidth = action.mapData.width * action.mapData.tilewidth;
      const mapHeight = action.mapData.height * action.mapData.tileheight;
      const interactiveObjects = processMapObjects(action.mapData);
      
      return {
        ...state,
        map: {
          ...state.map,
          width: mapWidth,
          height: mapHeight,
          layers: action.mapData.layers || [],
          tileWidth: action.mapData.tilewidth,
          tileHeight: action.mapData.tileheight,
          interactiveObjects,
          mapReady: true,
        },
      };
      
    case 'SET_VIEWPORT':
      return {
        ...state,
        map: {
          ...state.map,
          viewportX: action.x,
          viewportY: action.y,
        },
      };
      
    case 'SET_NEARBY_OBJECT':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          nearbyObject: action.object,
        },
      };
      
    case 'START_DIALOG':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isDialogActive: true,
          dialogText: action.text,
          dialogSpeaker: action.speaker || null,
        },
      };
      
    case 'END_DIALOG':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isDialogActive: false,
          dialogText: '',
          dialogSpeaker: null,
        },
      };
      
    case 'START_BATTLE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isBattleActive: true,
          isDialogActive: false,
        },
      };
      
    case 'END_BATTLE':
      return {
        ...state,
        interaction: {
          ...state.interaction,
          isBattleActive: false,
        },
      };
      
    case 'SET_SCREEN_SIZE':
      return {
        ...state,
        ui: {
          ...state.ui,
          screenWidth: action.width,
          screenHeight: action.height,
        },
      };
      
    default:
      return state;
  }
}

// Context provider
export const ExploreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(exploreReducer, initialState);
  
  // Action dispatchers
  const movePlayer = useCallback((direction: Direction) => {
    dispatch({ type: 'MOVE_PLAYER', direction });
  }, []);
  
  const setMapData = useCallback((mapData: any) => {
    dispatch({ type: 'SET_MAP_DATA', mapData });
  }, []);
  
  const setViewport = useCallback((x: number, y: number) => {
    dispatch({ type: 'SET_VIEWPORT', x, y });
  }, []);
  
  const setNearbyObject = useCallback((object: MapObject | null) => {
    dispatch({ type: 'SET_NEARBY_OBJECT', object });
  }, []);
  
  const startDialog = useCallback((text: string, speaker?: string) => {
    dispatch({ type: 'START_DIALOG', text, speaker });
  }, []);
  
  const endDialog = useCallback(() => {
    dispatch({ type: 'END_DIALOG' });
  }, []);
  
  const startBattle = useCallback(() => {
    dispatch({ type: 'START_BATTLE' });
  }, []);
  
  const endBattle = useCallback(() => {
    dispatch({ type: 'END_BATTLE' });
  }, []);
  
  const setScreenSize = useCallback((width: number, height: number) => {
    dispatch({ type: 'SET_SCREEN_SIZE', width, height });
  }, []);
  
  const value = {
    state,
    movePlayer,
    setMapData,
    setViewport,
    setNearbyObject,
    startDialog,
    endDialog,
    startBattle,
    endBattle,
    setScreenSize,
  };
  
  return <ExploreContext.Provider value={value}>{children}</ExploreContext.Provider>;
};

// Custom hook for easy access to the context
export const useExplore = () => useContext(ExploreContext);
