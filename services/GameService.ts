import { Card, Player, GameState, GamePhase, ChallengeAttribute, createCard, Rarity } from '../models/Card';

// Sample card data for generating decks
// In a real app, you might fetch these from an API or database
const cardData: Array<{
  name: string;
  rarity: Rarity;
  skillRange: [number, number];
  staminaRange: [number, number];
  auraRange: [number, number];
}> = [
  { name: 'Lion', rarity: 'common', skillRange: [15, 20], staminaRange: [15, 20], auraRange: [15, 20] },
  { name: 'Eagle', rarity: 'common', skillRange: [15, 20], staminaRange: [15, 20], auraRange: [15, 20] },
  { name: 'Tiger', rarity: 'rare', skillRange: [17, 22], staminaRange: [17, 22], auraRange: [17, 22] },
  { name: 'Wolf', rarity: 'rare', skillRange: [17, 22], staminaRange: [17, 22], auraRange: [17, 22] },
  { name: 'Dragon', rarity: 'very_rare', skillRange: [19, 24], staminaRange: [19, 24], auraRange: [19, 24] },
  { name: 'Phoenix', rarity: 'very_rare', skillRange: [19, 24], staminaRange: [19, 24], auraRange: [19, 24] },
  { name: 'Unicorn', rarity: 'epic', skillRange: [21, 25], staminaRange: [21, 25], auraRange: [21, 25] },
  { name: 'Pegasus', rarity: 'epic', skillRange: [21, 25], staminaRange: [21, 25], auraRange: [21, 25] },
  { name: 'Chimera', rarity: 'spectacular', skillRange: [23, 25], staminaRange: [23, 25], auraRange: [23, 25] },
  { name: 'Kraken', rarity: 'spectacular', skillRange: [23, 25], staminaRange: [23, 25], auraRange: [23, 25] },
];

// Helper function to get random int between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random deck of cards
export function generateDeck(size: number = 20): Card[] {
  const deck: Card[] = [];
  
  for (let i = 0; i < size; i++) {
    // Pick a random card template from cardData
    const template = cardData[Math.floor(Math.random() * cardData.length)];
    
    // Generate random stats within the ranges
    const skill = getRandomInt(template.skillRange[0], template.skillRange[1]);
    const stamina = getRandomInt(template.staminaRange[0], template.staminaRange[1]);
    const aura = getRandomInt(template.auraRange[0], template.auraRange[1]);
    
    // Create a card with a unique id
    const card = createCard(
      `${template.name}-${i}-${Date.now()}`,
      `${template.name} #${i + 1}`,
      skill,
      stamina,
      aura,
      template.rarity
    );
    
    deck.push(card);
  }
  
  return shuffleDeck(deck);
}

// Shuffle a deck of cards
export function shuffleDeck<T>(deck: T[]): T[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

// Initialize a new game
export function initializeGame(player1Name: string, player2Name: string): GameState {
  const player1Deck = generateDeck(20);
  const player2Deck = generateDeck(20);
  
  const player1: Player = {
    id: 'player1',
    name: player1Name,
    deck: player1Deck,
    hand: [],
    points: { skill: 0, stamina: 0, aura: 0 },
    terrificTokenUsed: false,
  };
  
  const player2: Player = {
    id: 'player2',
    name: player2Name,
    deck: player2Deck,
    hand: [],
    points: { skill: 0, stamina: 0, aura: 0 },
    terrificTokenUsed: false,
  };
  
  return {
    roundNumber: 1,
    currentChallenger: 'player1',
    potSize: 1,
    cardsInPlay: { player1: null, player2: null },
    burnPile: [],
    challengeAttribute: null,
    deniedAttributes: [],
    availableAttributes: ['skill', 'stamina', 'aura'],
    phase: 'draw',
    winner: null,
    player1,
    player2,
  };
}

// Draw cards for both players
export function drawCards(state: GameState): GameState {
  // If we've already played 20 rounds, game is over - all cards are used
  if (state.roundNumber > 20) {
    // Determine winner based on highest total points
    const player1TotalPoints = 
      state.player1.points.skill + 
      state.player1.points.stamina + 
      state.player1.points.aura;
    
    const player2TotalPoints = 
      state.player2.points.skill + 
      state.player2.points.stamina + 
      state.player2.points.aura;
    
    const finalWinner = 
      player1TotalPoints > player2TotalPoints ? 'player1' : 
      player2TotalPoints > player1TotalPoints ? 'player2' : 
      null; // Tie
    
    return {
      ...state,
      phase: 'gameOver',
      winner: finalWinner
    };
  }
  
  // Reset available attributes at the start of each round
  const availableAttributes: ChallengeAttribute[] = ['skill', 'stamina', 'aura'];
  
  const player1Card = state.player1.deck.length > 0
    ? state.player1.deck[0]
    : null;
    
  const player2Card = state.player2.deck.length > 0
    ? state.player2.deck[0]
    : null;
  
  // Remove the top card from each player's deck
  const player1 = {
    ...state.player1,
    deck: state.player1.deck.slice(1)
  };
  
  const player2 = {
    ...state.player2,
    deck: state.player2.deck.slice(1)
  };
  
  return {
    ...state,
    cardsInPlay: {
      player1: player1Card,
      player2: player2Card
    },
    deniedAttributes: [],
    availableAttributes,
    phase: 'challengerPick',
    player1,
    player2
  };
}

// Challenger selects an attribute to challenge with
export function selectChallengeAttribute(
  state: GameState,
  attribute: ChallengeAttribute,
  useTerrificToken: boolean = false
): GameState {
  // Check if the attribute has already been denied this round
  if (state.deniedAttributes.includes(attribute)) {
    // Cannot select an attribute that has been denied
    return state;
  }
  
  // Check if player is trying to use Terrific Token when already used
  if (
    useTerrificToken && 
    ((state.currentChallenger === 'player1' && state.player1.terrificTokenUsed) || 
    (state.currentChallenger === 'player2' && state.player2.terrificTokenUsed))
  ) {
    return state; // Cannot use token again
  }
  
  // Cannot select 'total' directly unless using terrific token
  if (attribute === 'total' && !useTerrificToken) {
    return state;
  }
  
  // If using Terrific Token, force 'total' and mark as used
  let newState = { ...state };
  if (useTerrificToken) {
    newState = {
      ...newState,
      challengeAttribute: 'total',
      [state.currentChallenger]: {
        ...newState[state.currentChallenger],
        terrificTokenUsed: true
      }
    };
  } else {
    newState = {
      ...newState,
      challengeAttribute: attribute
    };
  }
  
  return {
    ...newState,
    phase: 'acceptDeny'
  };
}

// Opponent responds to challenge (accept or deny)
export function respondToChallenge(state: GameState, accept: boolean): GameState {
  if (accept) {
    // If accepted, move to resolve phase
    return {
      ...state,
      phase: 'resolve'
    };
  } else {
    // If denied, add current attribute to denied list
    const deniedAttributes = [...state.deniedAttributes];
    if (state.challengeAttribute && state.challengeAttribute !== 'total') {
      deniedAttributes.push(state.challengeAttribute);
    }
    
    // Calculate remaining attributes
    const availableAttributes = ['skill', 'stamina', 'aura'].filter(
      attr => !deniedAttributes.includes(attr as ChallengeAttribute)
    ) as ChallengeAttribute[];
    
    // If all three attributes have been denied, or if 'total' was challenged and denied, force total
    if (availableAttributes.length === 0 || state.challengeAttribute === 'total') {
      return {
        ...state,
        challengeAttribute: 'total',
        phase: 'resolve'
      };
    }
    
    // If only one attribute remains, force it
    if (availableAttributes.length === 1) {
      return {
        ...state,
        challengeAttribute: availableAttributes[0],
        phase: 'resolve'
      };
    }
    
    // Otherwise, return to challenger pick with updated denied attributes
    // Also switch challenger since the initial challenge was denied
    return {
      ...state,
      deniedAttributes,
      availableAttributes,
      currentChallenger: state.currentChallenger === 'player1' ? 'player2' : 'player1',
      challengeAttribute: null,
      phase: 'challengerPick'
    };
  }
}

// Resolve the challenge and update game state
export function resolveChallenge(state: GameState): GameState {
  const { cardsInPlay, challengeAttribute, potSize } = state;
  
  // Need both cards to resolve
  if (!cardsInPlay.player1 || !cardsInPlay.player2 || !challengeAttribute) {
    return state;
  }
  
  // Get values to compare based on challenge attribute
  const player1Value = 
    challengeAttribute === 'total' ? cardsInPlay.player1.finalTotal :
    cardsInPlay.player1[challengeAttribute];
    
  const player2Value = 
    challengeAttribute === 'total' ? cardsInPlay.player2.finalTotal :
    cardsInPlay.player2[challengeAttribute];
  
  let newState: GameState;
  
  // Add cards to burn pile
  const burnPile = [...state.burnPile];
  if (cardsInPlay.player1) burnPile.push(cardsInPlay.player1);
  if (cardsInPlay.player2) burnPile.push(cardsInPlay.player2);
  
  // Handle tie
  if (player1Value === player2Value) {
    newState = {
      ...state,
      potSize: potSize + 1,
      roundNumber: state.roundNumber + 1,
      burnPile,
      phase: 'draw',
      cardsInPlay: { player1: null, player2: null },
      challengeAttribute: null,
      deniedAttributes: [],
    };
    
    return newState;
  }
  
  // Determine winner
  const winner = player1Value > player2Value ? 'player1' : 'player2';
  
  // Update points for winner
  const newPoints = { ...state[winner].points };
  
  if (challengeAttribute === 'total') {
    // Total: winner gets +1 in each attribute
    newPoints.skill += potSize;
    newPoints.stamina += potSize;
    newPoints.aura += potSize;
  } else {
    // Single attribute: winner gets points in that attribute
    newPoints[challengeAttribute] += potSize;
  }
  
  // Check if any attribute has reached 7 points
  const gameWinner = (
    newPoints.skill >= 7 || 
    newPoints.stamina >= 7 || 
    newPoints.aura >= 7
  ) ? winner : null;
  
  newState = {
    ...state,
    [winner]: {
      ...state[winner],
      points: newPoints,
    },
    roundNumber: state.roundNumber + 1,
    potSize: 1, // Reset pot
    burnPile,
    cardsInPlay: { player1: null, player2: null },
    challengeAttribute: null,
    deniedAttributes: [],
    availableAttributes: ['skill', 'stamina', 'aura'],
    // Switch challenger for next round
    currentChallenger: state.currentChallenger === 'player1' ? 'player2' : 'player1',
    phase: gameWinner ? 'gameOver' : 'draw',
    winner: gameWinner
  };
  
  return newState;
}

// Handle game action based on current phase
export function handleGameAction(state: GameState, action: any): GameState {
  switch (state.phase) {
    case 'draw':
      return drawCards(state);
    case 'challengerPick':
      return selectChallengeAttribute(
        state, 
        action.attribute, 
        action.useTerrificToken
      );
    case 'acceptDeny':
      return respondToChallenge(state, action.accept);
    case 'resolve':
      return resolveChallenge(state);
    case 'gameOver':
      return state;
    default:
      return state;
  }
}

// Reset the game
export function resetGame(state: GameState): GameState {
  return initializeGame(state.player1.name, state.player2.name);
}
