import { Card, CardAbility, CardType, CardRarity, createBasicCard } from '../models/Card';

// Define some reusable abilities
const ABILITIES: { [key: string]: CardAbility } = {
  // Fire abilities
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a ball of fire that deals damage to opponent',
    energyCost: 2,
    cooldown: 1,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 15,
  },
  flameShield: {
    id: 'flameShield',
    name: 'Flame Shield',
    description: 'Surround yourself with a shield of fire, increasing defense',
    energyCost: 2,
    cooldown: 2,
    targetType: 'self',
    effectType: 'buff',
    effectValue: 10,
  },
  
  // Water abilities
  waterBlast: {
    id: 'waterBlast',
    name: 'Water Blast',
    description: 'Shoot a jet of water that deals damage to opponent',
    energyCost: 2,
    cooldown: 1,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 12,
  },
  heal: {
    id: 'heal',
    name: 'Healing Waters',
    description: 'Heal yourself with magical water',
    energyCost: 3,
    cooldown: 3,
    targetType: 'self',
    effectType: 'heal',
    effectValue: 20,
  },
  
  // Earth abilities
  rockThrow: {
    id: 'rockThrow',
    name: 'Rock Throw',
    description: 'Throw a rock at the opponent',
    energyCost: 1,
    cooldown: 1,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 10,
  },
  stoneSkin: {
    id: 'stoneSkin',
    name: 'Stone Skin',
    description: 'Harden your skin, greatly increasing defense',
    energyCost: 2,
    cooldown: 3,
    targetType: 'self',
    effectType: 'buff',
    effectValue: 15,
  },
  
  // Air abilities
  windSlash: {
    id: 'windSlash',
    name: 'Wind Slash',
    description: 'Create sharp air currents that slice the opponent',
    energyCost: 2,
    cooldown: 1,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 8,
  },
  speedBoost: {
    id: 'speedBoost',
    name: 'Speed Boost',
    description: 'Surround yourself with wind, increasing speed',
    energyCost: 1,
    cooldown: 2,
    targetType: 'self',
    effectType: 'buff',
    effectValue: 15,
  },
  
  // Light abilities
  lightBeam: {
    id: 'lightBeam',
    name: 'Light Beam',
    description: 'Fire a concentrated beam of light',
    energyCost: 3,
    cooldown: 2,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 20,
  },
  blessing: {
    id: 'blessing',
    name: 'Divine Blessing',
    description: 'Receive divine energy that heals and boosts all stats',
    energyCost: 4,
    cooldown: 4,
    targetType: 'self',
    effectType: 'special',
    effectValue: 10,
  },
  
  // Dark abilities
  shadowStrike: {
    id: 'shadowStrike',
    name: 'Shadow Strike',
    description: 'Attack from the shadows for heavy damage',
    energyCost: 3,
    cooldown: 2,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 25,
  },
  curse: {
    id: 'curse',
    name: 'Curse',
    description: 'Place a dark curse on the opponent, reducing their stats',
    energyCost: 2,
    cooldown: 3,
    targetType: 'opponent',
    effectType: 'debuff',
    effectValue: 10,
  },
  
  // Neutral abilities
  tackle: {
    id: 'tackle',
    name: 'Tackle',
    description: 'A basic physical attack',
    energyCost: 1,
    cooldown: 0,
    targetType: 'opponent',
    effectType: 'damage',
    effectValue: 5,
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    description: 'Concentrate to boost your attack',
    energyCost: 1,
    cooldown: 2,
    targetType: 'self',
    effectType: 'buff',
    effectValue: 8,
  },
};

// Create the card data
export const CARDS: Card[] = [
  // Fire cards
  {
    ...createBasicCard(
      'fire_dragon',
      'Fire Dragon',
      'fire',
      'legendary',
      'https://placeholder.com/fire_dragon.jpg',
      { attack: 80, defense: 60, speed: 50, special: 85, health: 90 },
      'A powerful dragon that breathes fire and brings destruction.'
    ),
    abilities: [ABILITIES.fireball, ABILITIES.flameShield],
  },
  {
    ...createBasicCard(
      'ember_spirit',
      'Ember Spirit',
      'fire',
      'rare',
      'https://placeholder.com/ember_spirit.jpg',
      { attack: 60, defense: 40, speed: 70, special: 65, health: 55 },
      'A spirited elemental made of pure fire.'
    ),
    abilities: [ABILITIES.fireball],
  },
  {
    ...createBasicCard(
      'flame_wolf',
      'Flame Wolf',
      'fire',
      'uncommon',
      'https://placeholder.com/flame_wolf.jpg',
      { attack: 45, defense: 30, speed: 60, special: 40, health: 50 },
      'A wolf with a fiery mane that leaves embers in its wake.'
    ),
    abilities: [ABILITIES.tackle],
  },
  
  // Water cards
  {
    ...createBasicCard(
      'sea_serpent',
      'Sea Serpent',
      'water',
      'legendary',
      'https://placeholder.com/sea_serpent.jpg',
      { attack: 70, defense: 65, speed: 75, special: 80, health: 85 },
      'An ancient creature from the depths of the ocean.'
    ),
    abilities: [ABILITIES.waterBlast, ABILITIES.heal],
  },
  {
    ...createBasicCard(
      'water_elemental',
      'Water Elemental',
      'water',
      'rare',
      'https://placeholder.com/water_elemental.jpg',
      { attack: 50, defense: 65, speed: 45, special: 70, health: 60 },
      'A being formed from pure water, flowing and adapting.'
    ),
    abilities: [ABILITIES.waterBlast],
  },
  {
    ...createBasicCard(
      'river_dolphin',
      'River Dolphin',
      'water',
      'common',
      'https://placeholder.com/river_dolphin.jpg',
      { attack: 25, defense: 30, speed: 70, special: 40, health: 45 },
      'A playful dolphin with special water powers.'
    ),
    abilities: [ABILITIES.tackle],
  },
  
  // Earth cards
  {
    ...createBasicCard(
      'mountain_titan',
      'Mountain Titan',
      'earth',
      'legendary',
      'https://placeholder.com/mountain_titan.jpg',
      { attack: 85, defense: 90, speed: 20, special: 60, health: 100 },
      'A colossal being of stone and earth that can shape mountains.'
    ),
    abilities: [ABILITIES.rockThrow, ABILITIES.stoneSkin],
  },
  {
    ...createBasicCard(
      'boulder_beast',
      'Boulder Beast',
      'earth',
      'uncommon',
      'https://placeholder.com/boulder_beast.jpg',
      { attack: 55, defense: 65, speed: 25, special: 30, health: 70 },
      'A creature with a body made of rough boulders and rocks.'
    ),
    abilities: [ABILITIES.rockThrow],
  },
  
  // Air cards
  {
    ...createBasicCard(
      'storm_phoenix',
      'Storm Phoenix',
      'air',
      'epic',
      'https://placeholder.com/storm_phoenix.jpg',
      { attack: 65, defense: 45, speed: 85, special: 75, health: 70 },
      'A legendary bird that controls the storms and winds.'
    ),
    abilities: [ABILITIES.windSlash, ABILITIES.speedBoost],
  },
  {
    ...createBasicCard(
      'wind_sprite',
      'Wind Sprite',
      'air',
      'common',
      'https://placeholder.com/wind_sprite.jpg',
      { attack: 20, defense: 15, speed: 80, special: 35, health: 30 },
      'A tiny elemental that dances on the breeze.'
    ),
    abilities: [ABILITIES.speedBoost],
  },
  
  // Light cards
  {
    ...createBasicCard(
      'celestial_guardian',
      'Celestial Guardian',
      'light',
      'epic',
      'https://placeholder.com/celestial_guardian.jpg',
      { attack: 60, defense: 70, speed: 60, special: 85, health: 75 },
      'An angelic being of pure light that protects the innocent.'
    ),
    abilities: [ABILITIES.lightBeam, ABILITIES.blessing],
  },
  
  // Dark cards
  {
    ...createBasicCard(
      'shadow_assassin',
      'Shadow Assassin',
      'dark',
      'rare',
      'https://placeholder.com/shadow_assassin.jpg',
      { attack: 75, defense: 40, speed: 80, special: 60, health: 55 },
      'A deadly assassin that melts into the shadows.'
    ),
    abilities: [ABILITIES.shadowStrike, ABILITIES.curse],
  },
  
  // Neutral cards
  {
    ...createBasicCard(
      'wild_bear',
      'Wild Bear',
      'neutral',
      'common',
      'https://placeholder.com/wild_bear.jpg',
      { attack: 40, defense: 35, speed: 30, special: 10, health: 60 },
      'A strong bear with fierce claws and teeth.'
    ),
    abilities: [ABILITIES.tackle],
  },
  {
    ...createBasicCard(
      'mystic_fox',
      'Mystic Fox',
      'neutral',
      'uncommon',
      'https://placeholder.com/mystic_fox.jpg',
      { attack: 30, defense: 25, speed: 70, special: 55, health: 45 },
      'A cunning fox with mysterious abilities.'
    ),
    abilities: [ABILITIES.focus],
  },
];

// Helper function to get cards by type
export function getCardsByType(type: CardType): Card[] {
  return CARDS.filter(card => card.type === type);
}

// Helper function to get cards by rarity
export function getCardsByRarity(rarity: CardRarity): Card[] {
  return CARDS.filter(card => card.rarity === rarity);
}

// Helper function to get a random selection of cards
export function getRandomCards(count: number): Card[] {
  const shuffled = [...CARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper to get starter deck
export function getStarterDeck(): Card[] {
  // Return a balanced set of starter cards
  return [
    CARDS.find(card => card.id === 'flame_wolf')!,
    CARDS.find(card => card.id === 'river_dolphin')!,
    CARDS.find(card => card.id === 'boulder_beast')!,
    CARDS.find(card => card.id === 'wind_sprite')!,
    CARDS.find(card => card.id === 'wild_bear')!,
    CARDS.find(card => card.id === 'mystic_fox')!,
  ];
}
