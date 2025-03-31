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
    // Remove newlines and excessive whitespace
    const cleanedString = deckString.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
    
    // Handle string that looks like concatenated JavaScript (common in error logs)
    const concatRegex = /\[\s*'\s*\{\s*\\n/;
    if (concatRegex.test(cleanedString)) {
      console.log('Detected concatenated string format, attempting special parsing');
      return parseJavaScriptConcatenation(cleanedString);
    }
    
    try {
      // Try standard JSON parsing first
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
 * Special parser for strings that look like JavaScript concatenation expressions
 * This handles the format seen in logs: "[\\n' + '  {\\n" +...
 */
function parseJavaScriptConcatenation(str) {
  try {
    // Remove the string concatenation artifacts
    const cleaned = str
      .replace(/\[\s*'\s*\{\s*\\n'\s*\+/g, '[{') // Fix start of array
      .replace(/\s*\+\s*'\s*\}\s*\\n'\s*\+/g, '},{') // Fix between objects
      .replace(/\s*\+\s*'\s*\}\s*\\n'\s*\+\s*'\s*\]/g, '}]') // Fix end of array
      .replace(/\s*\+\s*'\s*\}\s*\]/g, '}]') // Alternative end format
      .replace(/\s*\+\s*'/g, '') // Remove concatenation starts
      .replace(/'\s*\+/g, '') // Remove concatenation ends
      .replace(/\\n/g, '') // Remove newline escapes
      .replace(/\\"/g, '"') // Fix escaped double quotes
      .replace(/"\s*\+\s*"/g, '') // Remove empty string concatenations
      // Fix property values enclosed in quotes
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
      // Fix string values with single quotes
      .replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // Try to parse as JSON after cleaning
    try {
      const result = JSON.parse(cleaned);
      if (Array.isArray(result)) {
        return result.map(formatCard);
      }
    } catch (err) {
      console.log('Failed to parse cleaned concatenated string:', err);
      
      // Last resort: try to extract card objects individually
      return parseManual(cleaned);
    }
  } catch (error) {
    console.error('Error parsing concatenated string:', error);
    return [];
  }
  
  return [];
}

/**
 * A very simple manual parser for array of objects notation
 * This is a last resort for malformed strings
 */
function parseManual(str) {
  const cards = [];
  
  // Super simplified parsing - just extract what looks like valid cards
  const matches = str.matchAll(/\{\s*['"]{0,1}id['"]{0,1}\s*:\s*['"]([^'"]+)['"]/g);
  
  for (const match of matches) {
    try {
      const cardStartIndex = match.index;
      // Find the matching closing brace - naive approach
      let cardEndIndex = -1;
      let openBraces = 0;
      
      for (let i = cardStartIndex; i < str.length; i++) {
        if (str[i] === '{') openBraces++;
        else if (str[i] === '}') {
          openBraces--;
          if (openBraces === 0) {
            cardEndIndex = i;
            break;
          }
        }
      }
      
      if (cardEndIndex > cardStartIndex) {
        const cardString = str.substring(cardStartIndex, cardEndIndex + 1);
        
        // Extract key values using regex
        const id = (cardString.match(/id['"]{0,1}\s*:\s*['"]([^'"]+)['"]/)?.[1]) || generateId();
        const name = (cardString.match(/name['"]{0,1}\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'Unknown Card';
        const skill = parseInt((cardString.match(/skill['"]{0,1}\s*:\s*(\d+)/)?.[1]) || '10');
        const stamina = parseInt((cardString.match(/stamina['"]{0,1}\s*:\s*(\d+)/)?.[1]) || '10');
        const aura = parseInt((cardString.match(/aura['"]{0,1}\s*:\s*(\d+)/)?.[1]) || '10');
        const baseTotal = parseInt((cardString.match(/baseTotal['"]{0,1}\s*:\s*(\d+)/)?.[1]) || (skill + stamina + aura).toString());
        const finalTotal = parseInt((cardString.match(/finalTotal['"]{0,1}\s*:\s*(\d+)/)?.[1]) || baseTotal.toString());
        const rarity = (cardString.match(/rarity['"]{0,1}\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'common';
        const character = (cardString.match(/character['"]{0,1}\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'Unknown';
        const type = (cardString.match(/type['"]{0,1}\s*:\s*['"]([^'"]+)['"]/)?.[1]) || 'standard';
        
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
 * and properly typed
 */
function formatCard(card) {
  if (!card || typeof card !== 'object') {
    return createDefaultCard();
  }
  
  // Calculate totals if needed
  const skill = typeof card.skill === 'number' ? card.skill : parseInt(card.skill) || 10;
  const stamina = typeof card.stamina === 'number' ? card.stamina : parseInt(card.stamina) || 10;
  const aura = typeof card.aura === 'number' ? card.aura : parseInt(card.aura) || 10;
  const baseTotal = Number(card.baseTotal) || (skill + stamina + aura);
  const finalTotal = Number(card.finalTotal) || baseTotal;
  
  // Return a clean plain object (not a Mongoose document)
  return {
    id: String(card.id || generateId()),
    name: String(card.name || 'Unknown Card'),
    skill: Number(skill),
    stamina: Number(stamina),
    aura: Number(aura),
    baseTotal: Number(baseTotal),
    finalTotal: Number(finalTotal),
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
