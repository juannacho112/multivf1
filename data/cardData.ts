import { Card, Rarity, createCard } from '../models/Card';

// Rarity multipliers for finalTotal calculation
export const RARITY_MULTIPLIERS = {
  common: 1,
  rare: 1.5,
  very_rare: 2,
  epic: 2.5,
  spectacular: 3
};

// Rarity points cost
export const RARITY_POINTS = {
  common: 0,
  rare: 2,
  very_rare: 3,
  epic: 4,
  spectacular: 5
};

// Base card data - 50 unique creatures
export const baseCardData = [
  // Forest creatures
  { id: 'wolf', name: 'Wolf', baseSkill: 18, baseStamina: 19, baseAura: 15, type: 'forest' },
  { id: 'bear', name: 'Bear', baseSkill: 16, baseStamina: 22, baseAura: 14, type: 'forest' },
  { id: 'fox', name: 'Fox', baseSkill: 20, baseStamina: 16, baseAura: 17, type: 'forest' },
  { id: 'deer', name: 'Deer', baseSkill: 17, baseStamina: 20, baseAura: 16, type: 'forest' },
  { id: 'owl', name: 'Owl', baseSkill: 21, baseStamina: 15, baseAura: 18, type: 'forest' },
  { id: 'raccoon', name: 'Raccoon', baseSkill: 19, baseStamina: 15, baseAura: 20, type: 'forest' },
  { id: 'squirrel', name: 'Squirrel', baseSkill: 22, baseStamina: 14, baseAura: 19, type: 'forest' },
  { id: 'badger', name: 'Badger', baseSkill: 17, baseStamina: 21, baseAura: 16, type: 'forest' },
  
  // Mythical creatures
  { id: 'dragon', name: 'Dragon', baseSkill: 22, baseStamina: 21, baseAura: 23, type: 'mythical' },
  { id: 'phoenix', name: 'Phoenix', baseSkill: 20, baseStamina: 19, baseAura: 25, type: 'mythical' },
  { id: 'griffin', name: 'Griffin', baseSkill: 21, baseStamina: 22, baseAura: 20, type: 'mythical' },
  { id: 'unicorn', name: 'Unicorn', baseSkill: 18, baseStamina: 18, baseAura: 24, type: 'mythical' },
  { id: 'pegasus', name: 'Pegasus', baseSkill: 19, baseStamina: 20, baseAura: 22, type: 'mythical' },
  { id: 'minotaur', name: 'Minotaur', baseSkill: 23, baseStamina: 25, baseAura: 15, type: 'mythical' },
  { id: 'fairy', name: 'Fairy', baseSkill: 15, baseStamina: 14, baseAura: 25, type: 'mythical' },
  
  // Ocean creatures
  { id: 'shark', name: 'Shark', baseSkill: 22, baseStamina: 20, baseAura: 16, type: 'ocean' },
  { id: 'dolphin', name: 'Dolphin', baseSkill: 20, baseStamina: 19, baseAura: 19, type: 'ocean' },
  { id: 'whale', name: 'Whale', baseSkill: 16, baseStamina: 25, baseAura: 18, type: 'ocean' },
  { id: 'octopus', name: 'Octopus', baseSkill: 23, baseStamina: 17, baseAura: 18, type: 'ocean' },
  { id: 'seahorse', name: 'Seahorse', baseSkill: 15, baseStamina: 15, baseAura: 22, type: 'ocean' },
  { id: 'jellyfish', name: 'Jellyfish', baseSkill: 14, baseStamina: 16, baseAura: 25, type: 'ocean' },
  { id: 'crab', name: 'Crab', baseSkill: 17, baseStamina: 24, baseAura: 15, type: 'ocean' },
  
  // Desert creatures
  { id: 'scorpion', name: 'Scorpion', baseSkill: 21, baseStamina: 16, baseAura: 17, type: 'desert' },
  { id: 'camel', name: 'Camel', baseSkill: 15, baseStamina: 24, baseAura: 16, type: 'desert' },
  { id: 'snake', name: 'Snake', baseSkill: 19, baseStamina: 18, baseAura: 19, type: 'desert' },
  { id: 'lizard', name: 'Lizard', baseSkill: 18, baseStamina: 17, baseAura: 18, type: 'desert' },
  { id: 'vulture', name: 'Vulture', baseSkill: 20, baseStamina: 19, baseAura: 16, type: 'desert' },
  { id: 'coyote', name: 'Coyote', baseSkill: 19, baseStamina: 20, baseAura: 18, type: 'desert' },
  
  // Insect creatures
  { id: 'bee', name: 'Bee', baseSkill: 19, baseStamina: 15, baseAura: 19, type: 'insect' },
  { id: 'ant', name: 'Ant', baseSkill: 17, baseStamina: 18, baseAura: 17, type: 'insect' },
  { id: 'butterfly', name: 'Butterfly', baseSkill: 16, baseStamina: 16, baseAura: 21, type: 'insect' },
  { id: 'spider', name: 'Spider', baseSkill: 21, baseStamina: 17, baseAura: 16, type: 'insect' },
  { id: 'mantis', name: 'Mantis', baseSkill: 22, baseStamina: 15, baseAura: 18, type: 'insect' },
  
  // Legendary creatures
  { id: 'chimera', name: 'Chimera', baseSkill: 23, baseStamina: 22, baseAura: 24, type: 'legendary' },
  { id: 'kraken', name: 'Kraken', baseSkill: 25, baseStamina: 24, baseAura: 21, type: 'legendary' },
  { id: 'hydra', name: 'Hydra', baseSkill: 24, baseStamina: 25, baseAura: 22, type: 'legendary' },
  { id: 'sphinx', name: 'Sphinx', baseSkill: 22, baseStamina: 21, baseAura: 25, type: 'legendary' },
  { id: 'behemoth', name: 'Behemoth', baseSkill: 20, baseStamina: 25, baseAura: 23, type: 'legendary' },
  
  // Character-themed creatures (new additions)
  { id: 'admiral', name: 'Admiral', baseSkill: 24, baseStamina: 18, baseAura: 20, type: 'character' },
  { id: 'red_devil', name: 'Red Devil', baseSkill: 23, baseStamina: 21, baseAura: 20, type: 'character' },
  { id: 'alien', name: 'Alien', baseSkill: 25, baseStamina: 15, baseAura: 25, type: 'character' },
  { id: 'cat', name: 'Cat', baseSkill: 25, baseStamina: 25, baseAura: 25, type: 'character' },
  { id: 'clown', name: 'Clown', baseSkill: 18, baseStamina: 17, baseAura: 25, type: 'character' },
  { id: 'werewolf', name: 'Werewolf', baseSkill: 24, baseStamina: 22, baseAura: 19, type: 'character' },
  { id: 'vampire', name: 'Vampire', baseSkill: 22, baseStamina: 18, baseAura: 24, type: 'character' },
  { id: 'astronaut', name: 'Astronaut', baseSkill: 20, baseStamina: 23, baseAura: 22, type: 'character' },
  { id: 'viking', name: 'Viking', baseSkill: 25, baseStamina: 25, baseAura: 15, type: 'character' },
  { id: 'zombie', name: 'Zombie', baseSkill: 16, baseStamina: 25, baseAura: 18, type: 'character' },
  { id: 'wizard', name: 'Wizard', baseSkill: 18, baseStamina: 17, baseAura: 24, type: 'character' },
  { id: 'ninja', name: 'Ninja', baseSkill: 25, baseStamina: 20, baseAura: 20, type: 'character' },
  { id: 'robot', name: 'Robot', baseSkill: 21, baseStamina: 25, baseAura: 16, type: 'character' },
  { id: 'pirate', name: 'Pirate', baseSkill: 22, baseStamina: 19, baseAura: 18, type: 'character' },
  
  // Special locked cards (these will be unlockable)
  { id: 'golden_phoenix', name: 'Golden Phoenix', baseSkill: 25, baseStamina: 25, baseAura: 25, type: 'special', locked: true },
  { id: 'shadow_dragon', name: 'Shadow Dragon', baseSkill: 25, baseStamina: 25, baseAura: 25, type: 'special', locked: true },
];

// Function to create a card with specific rarity
export function createCardWithRarity(baseCard: typeof baseCardData[0], rarity: Rarity): Card {
  // Base attributes should never exceed 25 per requirement
  const skill = Math.min(25, baseCard.baseSkill);
  const stamina = Math.min(25, baseCard.baseStamina);
  const aura = Math.min(25, baseCard.baseAura);
  
  // Calculate base total (without rarity multiplier)
  const baseTotal = skill + stamina + aura;
  
  // Apply rarity multiplier to get final total
  const multiplier = RARITY_MULTIPLIERS[rarity];
  const finalTotal = Math.round(baseTotal * multiplier);
  
  // Ensure each card has a unique ID
  const id = `${baseCard.id}-${rarity}`;
  
  // Create a displayable name that includes rarity
  let displayName = baseCard.name;
  if (rarity !== 'common') {
    displayName = `${rarity.charAt(0).toUpperCase() + rarity.slice(1).replace('_', ' ')} ${baseCard.name}`;
  }
  
  // Check if this card is locked (for special cards)
  const isLocked = baseCard.locked === true;
  
  return createCard(
    id,
    displayName,
    skill,
    stamina, 
    aura,
    rarity,
    baseCard.name, // character name (without rarity prefix)
    baseCard.type,
    !isLocked // unlocked status (inverse of locked)
  );
}

// Generate the full card pool with all rarity versions
export function generateCardPool(): Card[] {
  const cardPool: Card[] = [];
  const rarities: Rarity[] = ['common', 'rare', 'very_rare', 'epic', 'spectacular'];
  
  // Create each card in all rarities
  baseCardData.forEach(baseCard => {
    rarities.forEach(rarity => {
      cardPool.push(createCardWithRarity(baseCard, rarity));
    });
  });
  
  return cardPool;
}

// Calculate rarity points for a deck
export function calculateRarityPoints(deck: Card[]): number {
  return deck.reduce((total, card) => total + RARITY_POINTS[card.rarity], 0);
}

// Check if a character is already in the deck
export function isCharacterInDeck(deck: Card[], character: string): boolean {
  return deck.some(card => card.character === character);
}

// Function to unlock a card by ID
export function unlockCard(cardPool: Card[], cardId: string): Card[] {
  return cardPool.map(card => 
    card.id === cardId ? { ...card, unlocked: true } : card
  );
}

// Generate a random AI deck
export function generateRandomDeck(cardPool: Card[], maxCards: number = 20, maxRarityPoints: number = 15): Card[] {
  const deck: Card[] = [];
  const availableCards = [...cardPool];
  
  // Shuffle cards
  for (let i = availableCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
  }
  
  let currentRarityPoints = 0;
  
  // Build deck with cards that don't exceed RP limit
  for (const card of availableCards) {
    const cardRarityPoints = RARITY_POINTS[card.rarity];
    
    // Check if adding this card would exceed limits
    if (deck.length < maxCards && 
        currentRarityPoints + cardRarityPoints <= maxRarityPoints) {
      deck.push(card);
      currentRarityPoints += cardRarityPoints;
    }
    
    // Stop if we've reached the max cards
    if (deck.length >= maxCards) {
      break;
    }
  }
  
  return deck;
}

// Export the full card pool
export const fullCardPool = generateCardPool();
