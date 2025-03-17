// Card types based on element/category
export type CardType = 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark' | 'neutral';

// Rarity levels affecting card power and availability
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Card stats and attributes
export interface CardStats {
  attack: number;        // Attack power (0-100)
  defense: number;       // Defense power (0-100)
  speed: number;         // Speed/initiative (0-100)
  special: number;       // Special ability power (0-100)
  health: number;        // Health points (0-100)
}

// Card ability or effect that can be activated
export interface CardAbility {
  id: string;            // Unique identifier for the ability
  name: string;          // Display name
  description: string;   // Text description of what the ability does
  energyCost: number;    // Energy required to use (0-10)
  cooldown: number;      // Turns before the ability can be used again
  targetType: 'self' | 'opponent' | 'all' | 'random'; // Who the ability targets
  effectType: 'damage' | 'heal' | 'buff' | 'debuff' | 'special'; // Type of effect
  effectValue: number;   // Base value of the effect (e.g., damage amount)
}

// Main Card class
export interface Card {
  id: string;            // Unique identifier
  name: string;          // Display name
  description: string;   // Flavor text/description
  type: CardType;        // Element/category
  rarity: CardRarity;    // Rarity level
  imageUrl: string;      // URL to card image
  stats: CardStats;      // Card statistics
  abilities: CardAbility[]; // Special abilities (max 3)
  energyCost: number;    // Energy cost to play this card (1-10)
  
  // Optional properties for special cards
  evolution?: string;    // ID of the card this can evolve into
  requirements?: {       // Special requirements to play the card
    [key: string]: any;
  };
  
  // Optional metadata for collection/deck building
  set?: string;          // Card set/expansion
  artist?: string;       // Card artist
  releaseDate?: string;  // When the card was released
}

// Card in play during a battle (extends Card with battle state)
export interface CardInPlay extends Card {
  currentStats: CardStats; // Current stats (may differ from base stats due to battle effects)
  isActive: boolean;      // Whether card is currently in play
  turnPlayed: number;     // Which turn the card was played
  abilityCooldowns: {     // Current cooldown status for each ability
    [abilityId: string]: number;
  };
  statusEffects: {        // Active status effects on the card
    [effect: string]: {
      turnsRemaining: number;
      value: number;
    };
  };
}

// Helper function to create a basic card
export function createBasicCard(
  id: string,
  name: string,
  type: CardType,
  rarity: CardRarity,
  imageUrl: string,
  stats: Partial<CardStats>,
  description?: string
): Card {
  return {
    id,
    name,
    description: description || `A ${rarity} ${type} card named ${name}.`,
    type,
    rarity,
    imageUrl,
    stats: {
      attack: stats.attack || 10,
      defense: stats.defense || 10,
      speed: stats.speed || 10,
      special: stats.special || 10,
      health: stats.health || 30,
    },
    abilities: [],
    energyCost: rarityToEnergyCost(rarity),
  };
}

// Helper function to convert card from collection to battle-ready
export function prepareCardForBattle(card: Card): CardInPlay {
  return {
    ...card,
    currentStats: { ...card.stats },
    isActive: false,
    turnPlayed: 0,
    abilityCooldowns: {},
    statusEffects: {},
  };
}

// Helper to calculate energy cost based on rarity
function rarityToEnergyCost(rarity: CardRarity): number {
  switch (rarity) {
    case 'common': return 1;
    case 'uncommon': return 2;
    case 'rare': return 3;
    case 'epic': return 4;
    case 'legendary': return 5;
    default: return 1;
  }
}

// Card attribute color mapping (for UI)
export const cardTypeColors = {
  fire: '#FF5733',
  water: '#33A1FD',
  earth: '#A0522D',
  air: '#C5E3F6',
  light: '#FFFF99',
  dark: '#6A0DAD',
  neutral: '#CCCCCC',
};

// Rarity color mapping (for UI)
export const rarityColors = {
  common: '#B0B0B0',
  uncommon: '#55AA55',
  rare: '#5555FF',
  epic: '#AA55AA',
  legendary: '#FFAA00',
};
