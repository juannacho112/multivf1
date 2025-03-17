import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Card, ChallengeAttribute, Player } from '../models/Card';
import { fullCardPool, generateRandomDeck } from '../data/cardData';

// Helper function to generate a deck for a player
const generateDeck = (size: number, playerId: string): Card[] => {
  // Generate a random deck of cards using the cardData utility function
  return generateRandomDeck(fullCardPool, size, 15);
};

// Game state interface
interface GameState {
  // Players
  player1: Player;
  player2: Player;
  
  // Game phase
  phase: 'draw' | 'challengerPick' | 'acceptDeny' | 'resolve' | 'gameOver';
  currentChallenger: 'player1' | 'player2';
  
  // Challenge details
  challengeAttribute: ChallengeAttribute | null;
  deniedAttributes: ChallengeAttribute[];
  availableAttributes: ChallengeAttribute[];
  
  // Cards
  cardsInPlay: {
    player1: Card | null;
    player2: Card | null;
  };
  burnPile: Card[];
  
  // Round tracking
  roundNumber: number;
  potSize: number;
  winner: 'player1' | 'player2' | null;

  // Mode
  gameMode: 'exploration' | 'battle';
  
  // Player position in exploration mode
  playerPosition: {
    x: number;
    y: number;
  };
}

// Actions
type GameAction =
  | { type: 'DRAW_CARDS' }
  | { type: 'SELECT_ATTRIBUTE'; attribute: ChallengeAttribute; useTerrificToken?: boolean }
  | { type: 'RESPOND_TO_CHALLENGE'; accept: boolean }
  | { type: 'RESOLVE_CHALLENGE' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_MODE'; mode: 'exploration' | 'battle' }
  | { type: 'MOVE_PLAYER'; direction: 'up' | 'down' | 'left' | 'right' };

// Context
interface GameContextProps {
  state: GameState;
  drawCards: () => void;
  selectAttribute: (attribute: ChallengeAttribute, useTerrificToken?: boolean) => void;
  respondToChallenge: (accept: boolean) => void;
  resolveChallenge: () => void;
  resetGame: () => void;
  setGameMode: (mode: 'exploration' | 'battle') => void;
  movePlayer: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

// Initial state
const initialState: GameState = {
  player1: {
    id: 'player1',
    name: 'You',
    deck: generateDeck(20, 'player1'),
    hand: [],
    points: {
      skill: 0,
      stamina: 0,
      aura: 0,
    },
    terrificTokenUsed: false,
  },
  player2: {
    id: 'player2',
    name: 'AI Opponent',
    deck: generateDeck(20, 'player2'),
    hand: [],
    points: {
      skill: 0,
      stamina: 0,
      aura: 0,
    },
    terrificTokenUsed: false,
  },
  phase: 'draw',
  currentChallenger: 'player1',
  challengeAttribute: null,
  deniedAttributes: [],
  availableAttributes: ['skill', 'stamina', 'aura'],
  cardsInPlay: {
    player1: null,
    player2: null,
  },
  burnPile: [],
  roundNumber: 1,
  potSize: 1,
  winner: null,
  gameMode: 'exploration',
  playerPosition: {
    x: 150,
    y: 150,
  },
};

// Create context
const GameContext = createContext<GameContextProps | undefined>(undefined);

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'DRAW_CARDS': {
      if (state.player1.deck.length === 0 || state.player2.deck.length === 0) {
        // If either player is out of cards, game over
        return {
          ...state,
          phase: 'gameOver',
          winner: state.player1.deck.length > 0 ? 'player1' : 'player2',
        };
      }
      
      // Draw cards for both players
      const player1Card = state.player1.deck[0];
      const player2Card = state.player2.deck[0];
      
      return {
        ...state,
        cardsInPlay: {
          player1: player1Card,
          player2: player2Card,
        },
        player1: {
          ...state.player1,
          deck: state.player1.deck.slice(1),
        },
        player2: {
          ...state.player2,
          deck: state.player2.deck.slice(1),
        },
        phase: 'challengerPick',
        deniedAttributes: [],
        availableAttributes: ['skill', 'stamina', 'aura'],
        challengeAttribute: null,
      };
    }
    
    case 'SELECT_ATTRIBUTE': {
      if (action.useTerrificToken) {
        // Use terrific token to force total as the challenge attribute
        const playerId = state.currentChallenger;
        return {
          ...state,
          challengeAttribute: 'total',
          phase: 'resolve',  // Skip accept/deny with Terrific Token
          [playerId]: {
            ...state[playerId],
            terrificTokenUsed: true,
          },
        };
      }
      
      // Regular attribute selection
      return {
        ...state,
        challengeAttribute: action.attribute,
        phase: 'acceptDeny',
      };
    }
    
    case 'RESPOND_TO_CHALLENGE': {
      if (action.accept) {
        // Accepted challenge, move to resolve phase
        return {
          ...state,
          phase: 'resolve',
        };
      } else {
        // Denied challenge, add attribute to denied list
        if (!state.challengeAttribute) return state;
        
        const newDeniedAttributes = [...state.deniedAttributes, state.challengeAttribute];
        const newAvailableAttributes = state.availableAttributes.filter(attr => attr !== state.challengeAttribute);
        
        // If all attributes are denied, force resolution with total
        if (newAvailableAttributes.length === 0) {
          return {
            ...state,
            phase: 'resolve',
            challengeAttribute: 'total',
            deniedAttributes: newDeniedAttributes,
            // No pot increase for denials
          };
        }
        
        // Otherwise, switch challenger and return to challenger pick phase
        return {
          ...state,
          phase: 'challengerPick',
          challengeAttribute: null,
          deniedAttributes: newDeniedAttributes,
          availableAttributes: newAvailableAttributes,
          currentChallenger: state.currentChallenger === 'player1' ? 'player2' : 'player1',
          // No pot increase for denials
        };
      }
    }
    
    case 'RESOLVE_CHALLENGE': {
      const { player1, player2, cardsInPlay, challengeAttribute, potSize } = state;
      
      if (!cardsInPlay.player1 || !cardsInPlay.player2 || !challengeAttribute) {
        return state;
      }
      
      // Determine winner
      let roundWinner: 'player1' | 'player2' | null = null;
      let player1Value, player2Value;
      
      if (challengeAttribute === 'total') {
        player1Value = cardsInPlay.player1.finalTotal;
        player2Value = cardsInPlay.player2.finalTotal;
      } else {
        player1Value = cardsInPlay.player1[challengeAttribute] || 0;
        player2Value = cardsInPlay.player2[challengeAttribute] || 0;
      }
      
      if (player1Value > player2Value) {
        roundWinner = 'player1';
      } else if (player2Value > player1Value) {
        roundWinner = 'player2';
      }
      
      // Update points based on the challenge outcome
      const updatedPlayer1 = { ...player1 };
      const updatedPlayer2 = { ...player2 };
      
      // Handle different point awarding based on situation
      if (roundWinner) {
        if (challengeAttribute === 'total') {
          // For Total challenges (terrific token or all attributes denied), award 1 point in each attribute
          if (roundWinner === 'player1') {
            updatedPlayer1.points.skill += 1;
            updatedPlayer1.points.stamina += 1;
            updatedPlayer1.points.aura += 1;
          } else {
            updatedPlayer2.points.skill += 1;
            updatedPlayer2.points.stamina += 1;
            updatedPlayer2.points.aura += 1;
          }
        } else {
          // For regular attribute challenges, award points only for the specific attribute
          if (roundWinner === 'player1') {
            updatedPlayer1.points[challengeAttribute] += 1; // Just 1 point per attribute win
          } else {
            updatedPlayer2.points[challengeAttribute] += 1; // Just 1 point per attribute win
          }
        }
      } else {
        // In case of a tie, increase the pot size for next round
        return {
          ...state,
          cardsInPlay: {
            player1: null,
            player2: null,
          },
          burnPile: [...state.burnPile, cardsInPlay.player1!, cardsInPlay.player2!],
          phase: 'draw',
          roundNumber: state.roundNumber + 1,
          currentChallenger: state.currentChallenger === 'player1' ? 'player2' : 'player1',
          potSize: state.potSize + 1, // Increase pot size only on a tie
        };
      }
      
      // Check for game winner
      const gameWinner = 
        Object.values(updatedPlayer1.points).some(p => p >= 7) ? 'player1' :
        Object.values(updatedPlayer2.points).some(p => p >= 7) ? 'player2' : 
        null;
      
      // Add cards to burn pile
      const newBurnPile = [...state.burnPile];
      if (cardsInPlay.player1) newBurnPile.push(cardsInPlay.player1);
      if (cardsInPlay.player2) newBurnPile.push(cardsInPlay.player2);
      
      // Next round setup
      return {
        ...state,
        player1: updatedPlayer1,
        player2: updatedPlayer2,
        cardsInPlay: {
          player1: null,
          player2: null,
        },
        burnPile: newBurnPile,
        phase: gameWinner ? 'gameOver' : 'draw',
        roundNumber: state.roundNumber + 1,
        currentChallenger: state.currentChallenger === 'player1' ? 'player2' : 'player1',
        potSize: 1, // Reset pot size after a non-tie round
        winner: gameWinner,
      };
    }
    
    case 'RESET_GAME': {
      return {
        ...initialState,
        player1: {
          ...initialState.player1,
          deck: generateDeck(20, 'player1'),
        },
        player2: {
          ...initialState.player2,
          deck: generateDeck(20, 'player2'),
        },
        gameMode: state.gameMode, // Preserve current game mode
        playerPosition: state.playerPosition, // Preserve player position
      };
    }
    
    case 'SET_MODE': {
      return {
        ...state,
        gameMode: action.mode,
      };
    }
    
    case 'MOVE_PLAYER': {
      const { x, y } = state.playerPosition;
      const stepSize = 10;
      let newX = x;
      let newY = y;
      
      switch (action.direction) {
        case 'up':
          newY = Math.max(0, y - stepSize);
          break;
        case 'down':
          newY = Math.min(300, y + stepSize); // Assuming map height is 300
          break;
        case 'left':
          newX = Math.max(0, x - stepSize);
          break;
        case 'right':
          newX = Math.min(300, x + stepSize); // Assuming map width is 300
          break;
      }
      
      return {
        ...state,
        playerPosition: {
          x: newX,
          y: newY,
        },
      };
    }
    
    default:
      return state;
  }
}

// Provider
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  const drawCards = () => dispatch({ type: 'DRAW_CARDS' });
  
  const selectAttribute = (attribute: ChallengeAttribute, useTerrificToken?: boolean) => {
    dispatch({ type: 'SELECT_ATTRIBUTE', attribute, useTerrificToken });
  };
  
  const respondToChallenge = (accept: boolean) => {
    dispatch({ type: 'RESPOND_TO_CHALLENGE', accept });
  };
  
  const resolveChallenge = () => dispatch({ type: 'RESOLVE_CHALLENGE' });
  
  const resetGame = () => dispatch({ type: 'RESET_GAME' });
  
  const setGameMode = (mode: 'exploration' | 'battle') => {
    dispatch({ type: 'SET_MODE', mode });
  };
  
  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    dispatch({ type: 'MOVE_PLAYER', direction });
  };
  
  return (
    <GameContext.Provider
      value={{
        state,
        drawCards,
        selectAttribute,
        respondToChallenge,
        resolveChallenge,
        resetGame,
        setGameMode,
        movePlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using the context
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
