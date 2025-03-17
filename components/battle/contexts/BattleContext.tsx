import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Card, CardInPlay, prepareCardForBattle } from '../models/Card';
import { getStarterDeck, getRandomCards } from '../data/cardData';

// Define player interface
interface Player {
  id: string;
  name: string;
  energy: number;
  maxEnergy: number;
  deck: Card[];
  hand: Card[];
  field: CardInPlay[];
  discardPile: Card[];
}

// Define battle state interface
interface BattleState {
  isActive: boolean;
  currentTurn: number;
  activePlayerId: string;
  players: {
    [playerId: string]: Player;
  };
  selectedCard: Card | null;
  selectedAbilityId: string | null;
  targetCard: CardInPlay | null;
  logs: string[];
  winner: string | null;
  battleResult: {
    winnerId: string | null;
    playerXp: number;
    cardsWon: Card[];
  } | null;
}

// Define action types
type Action =
  | { type: 'START_BATTLE'; player1Deck: Card[]; player2Deck: Card[] }
  | { type: 'DRAW_CARD'; playerId: string; count?: number }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string }
  | { type: 'SELECT_CARD'; card: Card | null }
  | { type: 'SELECT_ABILITY'; abilityId: string | null }
  | { type: 'SELECT_TARGET'; card: CardInPlay | null }
  | { type: 'USE_ABILITY'; playerId: string; cardId: string; abilityId: string; targetId?: string }
  | { type: 'END_TURN' }
  | { type: 'END_BATTLE'; winnerId: string | null }
  | { type: 'ADD_LOG'; message: string };

// Initial state
const initialState: BattleState = {
  isActive: false,
  currentTurn: 0,
  activePlayerId: 'player1',
  players: {
    player1: {
      id: 'player1',
      name: 'You',
      energy: 3,
      maxEnergy: 3,
      deck: [],
      hand: [],
      field: [],
      discardPile: [],
    },
    player2: {
      id: 'player2',
      name: 'Opponent',
      energy: 3,
      maxEnergy: 3,
      deck: [],
      hand: [],
      field: [],
      discardPile: [],
    },
  },
  selectedCard: null,
  selectedAbilityId: null,
  targetCard: null,
  logs: [],
  winner: null,
  battleResult: null,
};

// Helper functions
const shuffleArray = <T extends any>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const drawCards = (state: BattleState, playerId: string, count: number): BattleState => {
  const player = state.players[playerId];
  
  if (!player) return state;
  
  // Determine how many cards we can draw
  const canDrawCount = Math.min(count, player.deck.length);
  
  if (canDrawCount === 0) {
    // No cards left to draw
    return {
      ...state,
      logs: [...state.logs, `${player.name} has no cards left to draw!`],
    };
  }
  
  // Draw cards from the top of the deck
  const newHand = [...player.hand, ...player.deck.slice(0, canDrawCount)];
  const newDeck = player.deck.slice(canDrawCount);
  
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: newHand,
        deck: newDeck,
      },
    },
    logs: [...state.logs, `${player.name} drew ${canDrawCount} card(s).`],
  };
};

const playCard = (state: BattleState, playerId: string, cardId: string): BattleState => {
  const player = state.players[playerId];
  
  if (!player) return state;
  
  // Find the card in the player's hand
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  
  if (cardIndex === -1) {
    // Card not found in hand
    return {
      ...state,
      logs: [...state.logs, `Card not found in ${player.name}'s hand.`],
    };
  }
  
  const card = player.hand[cardIndex];
  
  // Check if player has enough energy
  if (player.energy < card.energyCost) {
    return {
      ...state,
      logs: [...state.logs, `${player.name} doesn't have enough energy to play ${card.name}.`],
    };
  }
  
  // Create a new hand without the played card
  const newHand = [...player.hand.slice(0, cardIndex), ...player.hand.slice(cardIndex + 1)];
  
  // Prepare card for battle
  const cardInPlay = prepareCardForBattle(card);
  cardInPlay.isActive = true;
  cardInPlay.turnPlayed = state.currentTurn;
  
  // Add card to field and update player energy
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        hand: newHand,
        field: [...player.field, cardInPlay],
        energy: player.energy - card.energyCost,
      },
    },
    logs: [...state.logs, `${player.name} played ${card.name}.`],
  };
};

const useAbility = (
  state: BattleState,
  playerId: string,
  cardId: string,
  abilityId: string,
  targetId?: string
): BattleState => {
  const player = state.players[playerId];
  const opponent = state.players[playerId === 'player1' ? 'player2' : 'player1'];
  
  if (!player || !opponent) return state;
  
  // Find the card on the player's field
  const sourceCard = player.field.find(card => card.id === cardId);
  
  if (!sourceCard) {
    return {
      ...state,
      logs: [...state.logs, `Card not found on ${player.name}'s field.`],
    };
  }
  
  // Find the ability
  const ability = sourceCard.abilities.find(a => a.id === abilityId);
  
  if (!ability) {
    return {
      ...state,
      logs: [...state.logs, `Ability not found on ${sourceCard.name}.`],
    };
  }
  
  // Check if ability is on cooldown
  const cooldown = sourceCard.abilityCooldowns[abilityId] || 0;
  if (cooldown > 0) {
    return {
      ...state,
      logs: [
        ...state.logs,
        `${ability.name} is on cooldown for ${cooldown} more turn(s).`,
      ],
    };
  }
  
  // Check if player has enough energy
  if (player.energy < ability.energyCost) {
    return {
      ...state,
      logs: [
        ...state.logs,
        `${player.name} doesn't have enough energy to use ${ability.name}.`,
      ],
    };
  }
  
  // Find target if needed
  let targetCard = null;
  
  if (ability.targetType === 'self') {
    targetCard = sourceCard;
  } else if (ability.targetType === 'opponent' && targetId) {
    targetCard = opponent.field.find(card => card.id === targetId);
  } else if (ability.targetType === 'random') {
    // Choose a random opponent card if available
    if (opponent.field.length > 0) {
      const randomIndex = Math.floor(Math.random() * opponent.field.length);
      targetCard = opponent.field[randomIndex];
    }
  }
  
  if (!targetCard && ability.targetType !== 'self' && ability.targetType !== 'all') {
    return {
      ...state,
      logs: [...state.logs, `No valid target for ${ability.name}.`],
    };
  }
  
  // Apply ability effect
  let newState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        energy: player.energy - ability.energyCost,
        field: player.field.map(card => {
          if (card.id === sourceCard.id) {
            return {
              ...card,
              abilityCooldowns: {
                ...card.abilityCooldowns,
                [abilityId]: ability.cooldown,
              },
            };
          }
          return card;
        }),
      },
    },
    logs: [
      ...state.logs,
      `${player.name}'s ${sourceCard.name} used ${ability.name}.`,
    ],
  };
  
  // Apply effect based on type
  if (ability.targetType === 'self' || (targetCard && targetCard.id === sourceCard.id)) {
    // Self effect
    newState = applyAbilityEffect(
      newState,
      playerId,
      sourceCard.id,
      ability.effectType,
      ability.effectValue
    );
  } else if (ability.targetType === 'opponent' && targetCard) {
    // Opponent effect
    const opponentId = playerId === 'player1' ? 'player2' : 'player1';
    newState = applyAbilityEffect(
      newState,
      opponentId,
      targetCard.id,
      ability.effectType,
      ability.effectValue
    );
  } else if (ability.targetType === 'all') {
    // Apply to all cards
    // This is simplified for now
    newState = {
      ...newState,
      logs: [
        ...newState.logs,
        `${ability.name} affected all cards on the field.`,
      ],
    };
  }
  
  return newState;
};

const applyAbilityEffect = (
  state: BattleState,
  playerId: string,
  cardId: string,
  effectType: 'damage' | 'heal' | 'buff' | 'debuff' | 'special',
  effectValue: number
): BattleState => {
  const player = state.players[playerId];
  
  if (!player) return state;
  
  // Find the target card
  const targetCardIndex = player.field.findIndex(card => card.id === cardId);
  
  if (targetCardIndex === -1) return state;
  
  const targetCard = player.field[targetCardIndex];
  const newField = [...player.field];
  
  switch (effectType) {
    case 'damage': {
      // Calculate damage, accounting for defense
      const defense = targetCard.currentStats.defense;
      const actualDamage = Math.max(1, effectValue - Math.floor(defense / 10));
      const newHealth = Math.max(0, targetCard.currentStats.health - actualDamage);
      
      newField[targetCardIndex] = {
        ...targetCard,
        currentStats: {
          ...targetCard.currentStats,
          health: newHealth,
        },
      };
      
      // Check if card is defeated
      const isDefeated = newHealth <= 0;
      const logs = [
        ...state.logs,
        `${targetCard.name} took ${actualDamage} damage.`,
      ];
      
      if (isDefeated) {
        // Remove from field and add to discard pile
        return {
          ...state,
          players: {
            ...state.players,
            [playerId]: {
              ...player,
              field: player.field.filter(card => card.id !== cardId),
              discardPile: [...player.discardPile, targetCard],
            },
          },
          logs: [...logs, `${targetCard.name} was defeated!`],
        };
      }
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            field: newField,
          },
        },
        logs,
      };
    }
    
    case 'heal': {
      const newHealth = Math.min(
        targetCard.stats.health,
        targetCard.currentStats.health + effectValue
      );
      
      newField[targetCardIndex] = {
        ...targetCard,
        currentStats: {
          ...targetCard.currentStats,
          health: newHealth,
        },
      };
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            field: newField,
          },
        },
        logs: [
          ...state.logs,
          `${targetCard.name} healed for ${effectValue} health.`,
        ],
      };
    }
    
    case 'buff': {
      // Apply buff to attack and defense
      newField[targetCardIndex] = {
        ...targetCard,
        currentStats: {
          ...targetCard.currentStats,
          attack: targetCard.currentStats.attack + effectValue,
          defense: targetCard.currentStats.defense + effectValue,
        },
      };
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            field: newField,
          },
        },
        logs: [
          ...state.logs,
          `${targetCard.name} gained +${effectValue} to attack and defense.`,
        ],
      };
    }
    
    case 'debuff': {
      // Apply debuff to attack and defense
      newField[targetCardIndex] = {
        ...targetCard,
        currentStats: {
          ...targetCard.currentStats,
          attack: Math.max(0, targetCard.currentStats.attack - effectValue),
          defense: Math.max(0, targetCard.currentStats.defense - effectValue),
        },
      };
      
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: {
            ...player,
            field: newField,
          },
        },
        logs: [
          ...state.logs,
          `${targetCard.name} lost ${effectValue} attack and defense.`,
        ],
      };
    }
    
    case 'special': {
      // Special effects are complex, just a placeholder here
      return {
        ...state,
        logs: [
          ...state.logs,
          `A special effect was applied to ${targetCard.name}.`,
        ],
      };
    }
    
    default:
      return state;
  }
};

// Check for win conditions and update state
const checkWinCondition = (state: BattleState): BattleState => {
  const player1 = state.players.player1;
  const player2 = state.players.player2;
  
  // Check if a player has no cards left in both field and deck
  const player1Lost = player1.field.length === 0 && player1.deck.length === 0 && player1.hand.length === 0;
  const player2Lost = player2.field.length === 0 && player2.deck.length === 0 && player2.hand.length === 0;
  
  if (player1Lost && !player2Lost) {
    return {
      ...state,
      winner: 'player2',
      isActive: false,
      battleResult: {
        winnerId: 'player2',
        playerXp: 0, // No XP for losing
        cardsWon: [], // No cards won when losing
      },
      logs: [...state.logs, `${player2.name} wins the battle!`],
    };
  } else if (!player1Lost && player2Lost) {
    // Player wins, grant rewards
    const xpGained = 100 + state.currentTurn * 5;
    const cardsWon = getRandomCards(1); // Win 1 random card
    
    return {
      ...state,
      winner: 'player1',
      isActive: false,
      battleResult: {
        winnerId: 'player1',
        playerXp: xpGained,
        cardsWon,
      },
      logs: [
        ...state.logs,
        `${player1.name} wins the battle!`,
        `Gained ${xpGained} XP and ${cardsWon.length} new card(s)!`,
      ],
    };
  } else if (player1Lost && player2Lost) {
    // Draw
    return {
      ...state,
      winner: 'draw',
      isActive: false,
      battleResult: {
        winnerId: null,
        playerXp: 20, // Small XP for a draw
        cardsWon: [],
      },
      logs: [...state.logs, 'The battle ended in a draw!'],
    };
  }
  
  return state;
};

// Reducer function
function battleReducer(state: BattleState, action: Action): BattleState {
  switch (action.type) {
    case 'START_BATTLE': {
      // Initialize battle with player decks
      const player1Deck = shuffleArray(action.player1Deck);
      const player2Deck = shuffleArray(action.player2Deck);
      
      const newState = {
        ...initialState,
        isActive: true,
        currentTurn: 1,
        activePlayerId: 'player1',
        players: {
          player1: {
            ...initialState.players.player1,
            deck: player1Deck,
            hand: [],
          },
          player2: {
            ...initialState.players.player2,
            deck: player2Deck,
            hand: [],
          },
        },
        logs: ['Battle started!'],
      };
      
      // Draw starting hands (3 cards each)
      let afterDrawState = drawCards(newState, 'player1', 3);
      afterDrawState = drawCards(afterDrawState, 'player2', 3);
      
      return afterDrawState;
    }
    
    case 'DRAW_CARD': {
      return drawCards(state, action.playerId, action.count || 1);
    }
    
    case 'PLAY_CARD': {
      const newState = playCard(state, action.playerId, action.cardId);
      return checkWinCondition(newState);
    }
    
    case 'SELECT_CARD': {
      return {
        ...state,
        selectedCard: action.card,
        selectedAbilityId: null,
        targetCard: null,
      };
    }
    
    case 'SELECT_ABILITY': {
      return {
        ...state,
        selectedAbilityId: action.abilityId,
        targetCard: null,
      };
    }
    
    case 'SELECT_TARGET': {
      return {
        ...state,
        targetCard: action.card,
      };
    }
    
    case 'USE_ABILITY': {
      const newState = useAbility(
        state,
        action.playerId,
        action.cardId,
        action.abilityId,
        action.targetId
      );
      return checkWinCondition(newState);
    }
    
    case 'END_TURN': {
      // Switch active player
      const newActivePlayer = state.activePlayerId === 'player1' ? 'player2' : 'player1';
      
      // Update cooldowns and effects
      const updatedPlayers = { ...state.players };
      
      for (const playerId of Object.keys(updatedPlayers)) {
        updatedPlayers[playerId] = {
          ...updatedPlayers[playerId],
          // Restore some energy at the start of player's turn
          energy:
            playerId === newActivePlayer
              ? Math.min(
                updatedPlayers[playerId].maxEnergy,
                updatedPlayers[playerId].energy + 2
              )
              : updatedPlayers[playerId].energy,
          field: updatedPlayers[playerId].field.map(card => ({
            ...card,
            // Reduce cooldowns at the end of the owner's turn
            abilityCooldowns:
              playerId === state.activePlayerId
                ? Object.fromEntries(
                    Object.entries(card.abilityCooldowns).map(([id, cd]) => [
                      id,
                      Math.max(0, cd - 1),
                    ])
                  )
                : card.abilityCooldowns,
            // Update status effects (simplified)
            statusEffects: Object.fromEntries(
              Object.entries(card.statusEffects)
                .map(([effect, data]) => {
                  // Ensure data is an object with turnsRemaining property
                  if (typeof data === 'object' && data !== null && 'turnsRemaining' in data) {
                    return [
                      effect,
                      { ...data, turnsRemaining: data.turnsRemaining - 1 }
                    ];
                  }
                  // If data is not in expected format, keep it unchanged
                  return [effect, data];
                })
                // Only keep effects with remaining turns > 0
                .filter(([_, data]) => 
                  typeof data === 'object' && 
                  data !== null && 
                  'turnsRemaining' in data && 
                  data.turnsRemaining > 0
                )
            ),
          })),
        };
      }
      
      // Draw a card for the new active player
      const newState = {
        ...state,
        currentTurn: state.activePlayerId === 'player2' ? state.currentTurn + 1 : state.currentTurn,
        activePlayerId: newActivePlayer,
        players: updatedPlayers,
        selectedCard: null,
        selectedAbilityId: null,
        targetCard: null,
        logs: [
          ...state.logs,
          `Turn ${state.currentTurn} ended. ${updatedPlayers[newActivePlayer].name}'s turn.`,
        ],
      };
      
      return drawCards(newState, newActivePlayer, 1);
    }
    
    case 'END_BATTLE': {
      return {
        ...state,
        isActive: false,
        winner: action.winnerId,
        battleResult: {
          winnerId: action.winnerId,
          playerXp: action.winnerId === 'player1' ? 100 : 0,
          cardsWon: action.winnerId === 'player1' ? getRandomCards(1) : [],
        },
        logs: [...state.logs, 'Battle ended.'],
      };
    }
    
    case 'ADD_LOG': {
      return {
        ...state,
        logs: [...state.logs, action.message],
      };
    }
    
    default:
      return state;
  }
}

// Create context
const BattleContext = createContext<{
  state: BattleState;
  startBattle: (player1Deck?: Card[], player2Deck?: Card[]) => void;
  drawCard: (playerId: string, count?: number) => void;
  playCard: (playerId: string, cardId: string) => void;
  selectCard: (card: Card | null) => void;
  selectAbility: (abilityId: string | null) => void;
  selectTarget: (card: CardInPlay | null) => void;
  useAbility: (playerId: string, cardId: string, abilityId: string, targetId?: string) => void;
  endTurn: () => void;
  endBattle: (winnerId: string | null) => void;
  addLog: (message: string) => void;
}>({
  state: initialState,
  startBattle: () => {},
  drawCard: () => {},
  playCard: () => {},
  selectCard: () => {},
  selectAbility: () => {},
  selectTarget: () => {},
  useAbility: () => {},
  endTurn: () => {},
  endBattle: () => {},
  addLog: () => {},
});

// Context provider
export const BattleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(battleReducer, initialState);
  
  // Action dispatchers
  const startBattle = useCallback((player1Deck?: Card[], player2Deck?: Card[]) => {
    dispatch({
      type: 'START_BATTLE',
      player1Deck: player1Deck || getStarterDeck(),
      player2Deck: player2Deck || getRandomCards(6),
    });
  }, []);
  
  const drawCard = useCallback((playerId: string, count?: number) => {
    dispatch({ type: 'DRAW_CARD', playerId, count });
  }, []);
  
  const playCard = useCallback((playerId: string, cardId: string) => {
    dispatch({ type: 'PLAY_CARD', playerId, cardId });
  }, []);
  
  const selectCard = useCallback((card: Card | null) => {
    dispatch({ type: 'SELECT_CARD', card });
  }, []);
  
  const selectAbility = useCallback((abilityId: string | null) => {
    dispatch({ type: 'SELECT_ABILITY', abilityId });
  }, []);
  
  const selectTarget = useCallback((card: CardInPlay | null) => {
    dispatch({ type: 'SELECT_TARGET', card });
  }, []);
  
  const useAbility = useCallback((playerId: string, cardId: string, abilityId: string, targetId?: string) => {
    dispatch({ type: 'USE_ABILITY', playerId, cardId, abilityId, targetId });
  }, []);
  
  const endTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
  }, []);
  
  const endBattle = useCallback((winnerId: string | null) => {
    dispatch({ type: 'END_BATTLE', winnerId });
  }, []);
  
  const addLog = useCallback((message: string) => {
    dispatch({ type: 'ADD_LOG', message });
  }, []);
  
  const value = {
    state,
    startBattle,
    drawCard,
    playCard,
    selectCard,
    selectAbility,
    selectTarget,
    useAbility,
    endTurn,
    endBattle,
    addLog,
  };
  
  return <BattleContext.Provider value={value}>{children}</BattleContext.Provider>;
};

// Custom hook for easy access to the context
export const useBattle = () => useContext(BattleContext);
