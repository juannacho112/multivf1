/**
 * Utility functions for Veefriends card game
 */

// Rarity types and their multipliers for final total calculation
const rarityMultipliers = {
  common: 1,
  rare: 1.05,
  very_rare: 1.1,
  epic: 1.15,
  spectacular: 1.2
};

/**
 * Generate a random ID
 * @returns {string} Random ID string
 */
const generateCardId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Create a Veefriends card
 * @param {string} name Card name
 * @param {number} skill Skill value
 * @param {number} stamina Stamina value
 * @param {number} aura Aura value
 * @param {string} rarity Card rarity
 * @param {string} character Character name
 * @param {string} type Card type (optional)
 * @param {boolean} unlocked Whether the card is unlocked (default: true)
 * @returns {Object} Veefriends Card object
 */
const createVeefriendsCard = (
  name, 
  skill, 
  stamina, 
  aura, 
  rarity = 'common', 
  character, 
  type = 'standard',
  unlocked = true
) => {
  const baseTotal = skill + stamina + aura;
  const finalTotal = Math.floor(baseTotal * (rarityMultipliers[rarity] || 1));
  
  return {
    id: generateCardId(),
    name,
    skill,
    stamina,
    aura,
    baseTotal,
    finalTotal,
    rarity,
    character,
    type,
    unlocked
  };
};

/**
 * Veefriends card pool for generating random cards
 */
const fullCardPool = [
  // Aura-focused characters
  createVeefriendsCard("Empathetic Elephant", 15, 10, 30, "common", "Elephant"),
  createVeefriendsCard("Genuine Giraffe", 12, 14, 28, "common", "Giraffe"),
  createVeefriendsCard("Gratitude Gorilla", 14, 12, 26, "common", "Gorilla"),
  createVeefriendsCard("Patient Panda", 10, 15, 27, "common", "Panda"),
  createVeefriendsCard("Honest Hippopotamus", 13, 20, 29, "rare", "Hippopotamus"),
  createVeefriendsCard("Kind Koala", 8, 12, 32, "rare", "Koala"),
  createVeefriendsCard("Thoughtful Tiger", 16, 18, 30, "rare", "Tiger"),
  createVeefriendsCard("Mindful Moose", 14, 15, 34, "very_rare", "Moose"),
  createVeefriendsCard("Benevolent Bear", 18, 20, 38, "epic", "Bear"),
  createVeefriendsCard("Radiant Rhino", 20, 22, 45, "spectacular", "Rhino"),
  
  // Stamina-focused characters
  createVeefriendsCard("Resilient Rabbit", 14, 30, 10, "common", "Rabbit"),
  createVeefriendsCard("Determined Dog", 12, 28, 14, "common", "Dog"),
  createVeefriendsCard("Persistent Penguin", 10, 32, 12, "common", "Penguin"),
  createVeefriendsCard("Tenacious Turtle", 8, 35, 10, "common", "Turtle"),
  createVeefriendsCard("Steadfast Squirrel", 14, 34, 15, "rare", "Squirrel"),
  createVeefriendsCard("Enduring Eagle", 16, 32, 18, "rare", "Eagle"),
  createVeefriendsCard("Unwavering Unicorn", 15, 36, 16, "very_rare", "Unicorn"),
  createVeefriendsCard("Persistent Panther", 18, 40, 18, "epic", "Panther"),
  createVeefriendsCard("Relentless Rhino", 22, 46, 20, "spectacular", "Rhino"),
  
  // Skill-focused characters
  createVeefriendsCard("Clever Cat", 30, 12, 12, "common", "Cat"),
  createVeefriendsCard("Strategic Shark", 28, 14, 12, "common", "Shark"),
  createVeefriendsCard("Analytical Ant", 32, 8, 14, "common", "Ant"),
  createVeefriendsCard("Insightful Iguana", 30, 10, 12, "common", "Iguana"),
  createVeefriendsCard("Brilliant Butterfly", 33, 12, 17, "rare", "Butterfly"),
  createVeefriendsCard("Wise Wolf", 34, 16, 14, "rare", "Wolf"),
  createVeefriendsCard("Creative Crocodile", 38, 15, 14, "very_rare", "Crocodile"),
  createVeefriendsCard("Masterful Macaw", 42, 16, 18, "epic", "Macaw"),
  createVeefriendsCard("Genius Gorilla", 48, 18, 22, "spectacular", "Gorilla"),
  
  // Balanced characters
  createVeefriendsCard("Balanced Bison", 18, 18, 18, "common", "Bison"),
  createVeefriendsCard("Versatile Vulture", 20, 20, 18, "common", "Vulture"),
  createVeefriendsCard("Adaptable Armadillo", 19, 19, 20, "common", "Armadillo"),
  createVeefriendsCard("Flexible Fox", 20, 22, 22, "rare", "Fox"),
  createVeefriendsCard("Dynamic Dolphin", 24, 24, 24, "very_rare", "Dolphin"),
  createVeefriendsCard("Complete Cheetah", 28, 28, 28, "epic", "Cheetah"),
  createVeefriendsCard("Ultimate Unicorn", 32, 32, 32, "spectacular", "Unicorn"),
];

/**
 * Generate a deck of random cards from the card pool
 * @param {Array} cardPool Pool of cards to select from
 * @param {number} deckSize Number of cards in the deck
 * @param {number} maxDuplicates Maximum number of duplicate cards allowed (optional)
 * @returns {Array} Array of card objects forming a deck
 */
const generateRandomDeck = (cardPool, deckSize = 20, maxDuplicates = 2) => {
  const deck = [];
  const cardCounts = new Map(); // Track number of each card
  
  while (deck.length < deckSize) {
    // Get a random card
    const randomIndex = Math.floor(Math.random() * cardPool.length);
    const cardTemplate = cardPool[randomIndex];
    
    // Check if we've reached duplicate limit
    const cardId = cardTemplate.character; // Use character for uniqueness
    const currentCount = cardCounts.get(cardId) || 0;
    
    if (currentCount < maxDuplicates) {
      // Create a new instance of the card
      const card = { ...cardTemplate };
      
      // Generate a new ID for this instance
      card.id = generateCardId();
      
      // Add to deck
      deck.push(card);
      
      // Update card count
      cardCounts.set(cardId, currentCount + 1);
    }
  }
  
  return deck;
};

/**
 * Get a starter deck of Veefriends cards
 * @returns {Array} Array of card objects
 */
const getVeefriendsStarterDeck = () => {
  return [
    // Starter deck with a balanced mix of cards
    createVeefriendsCard("Empathetic Elephant", 15, 10, 30, "common", "Elephant"),
    createVeefriendsCard("Resilient Rabbit", 14, 30, 10, "common", "Rabbit"),
    createVeefriendsCard("Clever Cat", 30, 12, 12, "common", "Cat"),
    createVeefriendsCard("Balanced Bison", 18, 18, 18, "common", "Bison"),
    createVeefriendsCard("Genuine Giraffe", 12, 14, 28, "common", "Giraffe"),
    createVeefriendsCard("Determined Dog", 12, 28, 14, "common", "Dog"),
    createVeefriendsCard("Strategic Shark", 28, 14, 12, "common", "Shark"),
    createVeefriendsCard("Versatile Vulture", 20, 20, 18, "common", "Vulture"),
    createVeefriendsCard("Patient Panda", 10, 15, 27, "common", "Panda"),
    createVeefriendsCard("Tenacious Turtle", 8, 35, 10, "common", "Turtle")
  ];
};

// Original card game functions (keeping for compatibility)
const createCardTemplate = (
  name, 
  attack = 1, 
  defense = 1, 
  health = 10, 
  energyCost = 1
) => {
  return {
    id: generateCardId(),
    name,
    type: 'creature',
    rarity: 'common',
    energyCost,
    stats: {
      attack,
      defense,
      health
    },
    currentStats: {
      attack,
      defense,
      health
    },
    abilities: [
      {
        id: `ability-${generateCardId()}`,
        name: 'Attack',
        description: 'Deal damage to target',
        energyCost: 1,
        cooldown: 0,
        targetType: 'opponent',
        effectType: 'damage',
        effectValue: attack
      }
    ],
    abilityCooldowns: {},
    statusEffects: {},
    isActive: false
  };
};

const cardPool = [
  createCardTemplate('Fire Dragon', 5, 3, 12, 3),
  createCardTemplate('Water Elemental', 3, 4, 15, 3),
  createCardTemplate('Earth Golem', 2, 6, 18, 3),
  createCardTemplate('Air Spirit', 4, 2, 10, 2),
  createCardTemplate('Shadow Assassin', 6, 1, 8, 3),
  createCardTemplate('Light Mage', 3, 3, 12, 2),
  createCardTemplate('Forest Guardian', 3, 5, 14, 3),
  createCardTemplate('Mountain Giant', 4, 6, 16, 4),
  createCardTemplate('Sea Serpent', 5, 4, 14, 4),
  createCardTemplate('Desert Scorpion', 4, 3, 10, 2),
];

const getStarterDeck = () => {
  return [
    createCardTemplate('Novice Warrior', 2, 2, 10, 1),
    createCardTemplate('Apprentice Mage', 3, 1, 8, 2),
    createCardTemplate('Training Knight', 1, 3, 12, 1),
    createCardTemplate('Young Dragon', 4, 2, 10, 3),
    createCardTemplate('Forest Scout', 2, 1, 6, 1),
    createCardTemplate('Village Guard', 1, 2, 8, 1),
  ];
};

const getRandomCards = (count = 1) => {
  const randomCards = [];
  const availableCards = [...cardPool];
  
  for (let i = 0; i < count; i++) {
    if (availableCards.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const card = { ...availableCards[randomIndex] };
    
    card.id = generateCardId();
    
    card.abilities = card.abilities.map(ability => ({
      ...ability,
      id: `ability-${generateCardId()}`
    }));
    
    randomCards.push(card);
    
    availableCards.splice(randomIndex, 1);
  }
  
  return randomCards;
};

export {
  fullCardPool,
  generateRandomDeck,
  createVeefriendsCard,
  getVeefriendsStarterDeck,
  // Original exports
  getStarterDeck,
  getRandomCards,
  createCardTemplate,
  generateCardId
};
