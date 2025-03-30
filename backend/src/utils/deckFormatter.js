/**
 * Deck formatter utility for VeeFriends card game
 * Handles multiple input formats (JSON strings, JavaScript object notation, arrays)
 * and ensures proper structure for MongoDB storage
 */

/**
 * Ensures proper formatting of deck data regardless of input format
 * @param {string|Array|Object} deckData - Deck data that could be in various formats
 * @returns {Array} Array of properly formatted card objects
 */
export const ensureProperDeckFormat = (deckData) => {
  // If already an array of objects, just validate and return
  if (Array.isArray(deckData) && deckData.length > 0 && typeof deckData[0] === 'object') {
    return deckData.map(formatCard);
  }
  
  // Handle string input (could be JSON or JS object notation)
  if (typeof deckData === 'string') {
    return parseStringDeckData(deckData);
  }
  
  // Return empty array for invalid input
  console.warn('Invalid deck data format', typeof deckData);
  return [];
};

/**
 * Tries to parse string deck data that could be in various formats
 * @param {string} deckString - String representation of deck data
 * @returns {Array} Array of card objects
 */
function parseStringDeckData(deckString) {
  if (!deckString || typeof deckString !== 'string') {
    return [];
  }
  
  try {
    // Try standard JSON parsing first
    const cleanedString = deckString.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
    try {
      const jsonData = JSON.parse(cleanedString);
      return Array.isArray(jsonData) ? jsonData.map(formatCard) : [];
    } catch (jsonError) {
      console.log('JSON parsing failed, trying to convert from JS object format:', jsonError.message);
      
      // If JSON parsing fails, the string might be using JavaScript object notation
      // This is a simple attempt to handle JavaScript object notation with single quotes
      // Convert from JS notation to valid JSON
      const jsonReady = cleanedString
        // Replace single quotes with double quotes for property names
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // Replace single quotes with double quotes for string values
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        // Fix properly escaped single quotes in strings
        .replace(/\\'/g, "'");
      
      try {
        const parsedData = JSON.parse(jsonReady);
        return Array.isArray(parsedData) ? parsedData.map(formatCard) : [];
      } catch (jsError) {
        // Last resort: evaluate as JavaScript with safety precautions
        console.log('JSON conversion failed, attempting JavaScript evaluation:', jsError.message);
        
        // SAFETY: Only try to evaluate if string looks like an array of objects
        if (!/^\s*\[.*\]\s*$/.test(cleanedString)) {
          console.error('Unsafe string format, aborting evaluation');
          return [];
        }
        
        // A more permissive approach for JavaScript object notation
        try {
          // Create safe evaluation context
          const evalString = `(${cleanedString})`;
          const result = new Function('return ' + evalString)();
          
          if (Array.isArray(result)) {
            return result.map(formatCard);
          }
          return [];
        } catch (evalError) {
          console.error('JavaScript evaluation failed:', evalError.message);
          
          // One last attempt: manual parsing for simple object format
          // This handles cases like [{id: 'abc', ...}, {id: 'def', ...}]
          try {
            return parseManual(cleanedString);
          } catch (manualError) {
            console.error('Manual parsing failed:', manualError.message);
            return [];
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing deck string:', error.message);
    return [];
  }
}

/**
 * A very simple manual parser for array of objects notation
 * This is a last resort for malformed strings
 */
function parseManual(str) {
  const cards = [];
  let currentCard = {};
  let inArray = false;
  let inObject = false;
  let currentProperty = '';
  let currentValue = '';
  
  // Super simplified parsing - just extract what looks like valid cards
  const matches = str.matchAll(/\{\s*id\s*:\s*['"]([^'"]+)['"]/g);
  
  for (const match of matches) {
    try {
      const cardStartIndex = match.index;
      const cardEndIndex = str.indexOf('}', cardStartIndex);
      
      if (cardEndIndex > cardStartIndex) {
        const cardString = str.substring(cardStartIndex, cardEndIndex + 1);
        
        // Extract key values using regex
        const id = (cardString.match(/id\s*:\s*['"]([^'"]+)['"]/)?.[1]) || generateId();
        const name = (cardString.match(/name\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'Unknown Card';
        const skill = parseInt((cardString.match(/skill\s*:\s*(\d+)/)?.[1]) || '10');
        const stamina = parseInt((cardString.match(/stamina\s*:\s*(\d+)/)?.[1]) || '10');
        const aura = parseInt((cardString.match(/aura\s*:\s*(\d+)/)?.[1]) || '10');
        const rarity = (cardString.match(/rarity\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'common';
        const character = (cardString.match(/character\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'Unknown';
        const type = (cardString.match(/type\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'standard';
        
        const baseTotal = skill + stamina + aura;
        const finalTotal = baseTotal;
        
        cards.push({
          id,
          name,
          skill,
          stamina, 
          aura,
          baseTotal,
          finalTotal,
          rarity,
          character,
          type,
          unlocked: true
        });
      }
    } catch (error) {
      console.error('Error parsing individual card:', error);
      // Skip this card and continue
    }
  }
  
  return cards;
}

/**
 * Formats a card object to ensure all required fields are present
 */
function formatCard(card) {
  if (!card || typeof card !== 'object') {
    return createDefaultCard();
  }
  
  // Calculate totals if needed
  const skill = typeof card.skill === 'number' ? card.skill : parseInt(card.skill) || 10;
  const stamina = typeof card.stamina === 'number' ? card.stamina : parseInt(card.stamina) || 10;
  const aura = typeof card.aura === 'number' ? card.aura : parseInt(card.aura) || 10;
  const baseTotal = card.baseTotal || (skill + stamina + aura);
  const finalTotal = card.finalTotal || baseTotal;
  
  return {
    id: String(card.id || generateId()),
    name: String(card.name || 'Unknown Card'),
    skill: skill,
    stamina: stamina,
    aura: aura,
    baseTotal: baseTotal,
    finalTotal: finalTotal,
    rarity: String(card.rarity || 'common'),
    character: String(card.character || 'Unknown'),
    type: String(card.type || 'standard'),
    unlocked: Boolean(card.unlocked !== false)
  };
}

/**
 * Creates a default card when data is missing
 */
function createDefaultCard() {
  const skill = 10;
  const stamina = 10;
  const aura = 10;
  
  return {
    id: generateId(),
    name: 'Default Card',
    skill,
    stamina,
    aura,
    baseTotal: skill + stamina + aura,
    finalTotal: skill + stamina + aura,
    rarity: 'common',
    character: 'Unknown',
    type: 'standard',
    unlocked: true
  };
}

/**
 * Generates a unique ID for cards
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
