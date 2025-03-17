export type Rarity = 'common' | 'rare' | 'very_rare' | 'epic' | 'spectacular';
export type ChallengeAttribute = 'skill' | 'stamina' | 'aura' | 'total';
export type GamePhase = 'draw' | 'challengerPick' | 'acceptDeny' | 'resolve' | 'gameOver';

export interface Card {
  id: string;
  name: string;
  skill: number;
  stamina: number;
  aura: number;
  baseTotal: number;    // Total without rarity multiplier
  finalTotal: number;   // Total with rarity multiplier applied
  rarity: Rarity;
  type?: string;        // Card type (forest, mythical, ocean, etc.)
  character: string;    // Base character name to check for uniqueness
  unlocked: boolean;    // Whether the card is unlocked
  [key: string]: string | number | boolean | undefined; // Index signature for accessing attributes dynamically
}

export interface Player {
  id: 'player1' | 'player2';
  name: string;
  deck: Card[];
  hand: Card[];
  points: {
    skill: number;
    stamina: number;
    aura: number;
  };
  terrificTokenUsed: boolean;
}

export interface GameState {
  roundNumber: number;
  currentChallenger: 'player1' | 'player2';
  potSize: number;
  cardsInPlay: {
    player1: Card | null;
    player2: Card | null;
  };
  burnPile: Card[];
  challengeAttribute: ChallengeAttribute | null;
  deniedAttributes: ChallengeAttribute[];
  availableAttributes: ChallengeAttribute[];
  phase: GamePhase;
  winner: 'player1' | 'player2' | null;
  player1: Player;
  player2: Player;
}

export function createCard(
  id: string,
  name: string,
  skill: number,
  stamina: number,
  aura: number,
  rarity: Rarity,
  character: string,
  type?: string,
  unlocked: boolean = true
): Card {
  const baseTotal = skill + stamina + aura;
  // Rarity multiplier will be applied to finalTotal in the data layer
  return {
    id,
    name,
    skill,
    stamina,
    aura,
    baseTotal,
    finalTotal: baseTotal, // This will be adjusted by rarity multiplier in cardData.ts
    rarity,
    character,
    type,
    unlocked
  };
}

// Interface for saved deck
export interface SavedDeck {
  id: string;
  name: string;
  cards: Card[];
  dateCreated: string;
  dateModified: string;
}
