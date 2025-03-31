/**
 * Deck Formatter Utility
 * 
 * This utility provides robust functions to handle various formats of deck data
 * and consistently convert them to proper arrays of card objects.
 * It handles JSON strings, JavaScript string concatenation notation, and more.
 */

/**
 * Primary function to ensure a deck is properly formatted regardless of input format
 * @param {string|Array|Object} input - The input deck data in any format
 * @returns {Array} Properly formatted array of card objects
 */
export const ensureProperDeckFormat = (input) => {
  // If already an array of objects, return as-is
  if (Array.isArray(input) && input.length > 0 && typeof input[0] === 'object') {
    return input;
  }
  
  // If null or undefined, return empty array
  if (input === null || input === undefined) {
    return [];
  }
  
  try {
    let result;
    
    // If input is a string, try to parse it
    if (typeof input === 'string') {
      // Try different parsing approaches in order of most likely to work
      result = tryParseJSONString(input) || 
               tryParseJSConcatenation(input) ||
               tryParseLooseJSON(input);
               
      if (!result) {
        console.error("[DeckFormatter] Failed to parse string as deck");
        return [];
      }
    } else if (typeof input === 'object') {
      // If single card object, wrap in array
      result = [input];
    } else {
      console.error("[DeckFormatter] Unsupported input type:", typeof input);
      return [];
    }
    
    // Validate each card has minimum required fields
    return result.filter(card => 
      card && typeof card === 'object' && 
      // Check for required fields with type validation
      (card.id !== undefined || card.name !== undefined) &&
      (!isNaN(Number(card.skill)) || !isNaN(Number(card.stamina)) || !isNaN(Number(card.aura)))
    );
  } catch (error) {
    console.error("[DeckFormatter] Error formatting deck:", error);
    return [];
  }
};

/**
 * Try to parse input as a standard JSON string
 * @param {string} input - JSON string to parse
 * @returns {Array|null} Array of cards or null if parsing failed
 */
const tryParseJSONString = (input) => {
  try {
    // Clean up common issues with JSON strings
    const cleaned = input.replace(/\n/g, '')
                         .replace(/\s+/g, ' ')
                         .trim();
    
    const parsed = JSON.parse(cleaned);
    
    // Handle both array and object formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      return [parsed]; // Single card as object
    }
    
    return null;
  } catch (e) {
    return null; // Silent failure, will try next method
  }
};

/**
 * Try to parse JavaScript string concatenation format (from error logs)
 * @param {string} input - JavaScript string concatenation notation
 * @returns {Array|null} Array of cards or null if parsing failed
 */
const tryParseJSConcatenation = (input) => {
  try {
    // This handles the common pattern seen in error logs: "[\\n' + ..."
    
    // First check if this looks like concatenated strings
    if (input.includes("' +") || input.includes("\" +")) {
      // Replace JS string concatenation artifacts
      let cleanedStr = input
        .replace(/['"]\s*\+\s*['"]/g, '') // Remove quotes around + operators
        .replace(/\\n/g, '')              // Remove escaped newlines
        .replace(/\\'/g, "'")             // Unescape quotes
        .replace(/\\"/g, '"')             // Unescape double quotes
        .replace(/\s+/g, ' ')             // Normalize whitespace
        .trim();
        
      // Remove any leftover quotes at start/end
      cleanedStr = cleanedStr.replace(/^['"]/, '').replace(/['"]$/, '');
      
      // Try to fix common issues with unbalanced brackets
      if (!isBalanced(cleanedStr, '[', ']')) {
        cleanedStr = fixUnbalancedBrackets(cleanedStr, '[', ']');
      }
      
      // Try to parse as JSON after cleaning
      try {
        return JSON.parse(cleanedStr);
      } catch {
        // If that fails, try more aggressive cleaning and repair
        const repaired = repairBrokenJSON(cleanedStr);
        return JSON.parse(repaired);
      }
    }
    return null;
  } catch (e) {
    console.log("[DeckFormatter] JS Concat parse failed:", e.message);
    return null;
  }
};

/**
 * Try parsing with more flexible rules to handle non-standard JSON
 * @param {string} input - String to parse as loose JSON
 * @returns {Array|null} Array of cards or null if parsing failed
 */
const tryParseLooseJSON = (input) => {
  try {
    // This is for strings that look like JSON but aren't valid due to:
    // - Single quotes instead of double
    // - Missing quotes around property names
    // - Trailing commas
    
    // Replace single quotes with double quotes where appropriate
    let cleaned = input
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Quote property names
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .trim();
    
    // Try to make it a valid array if it's not already
    if (!cleaned.startsWith('[')) {
      cleaned = '[' + cleaned;
    }
    if (!cleaned.endsWith(']')) {
      cleaned = cleaned + ']';
    }
    
    // Try to parse
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

/**
 * Check if brackets are properly balanced in a string
 * @param {string} str - String to check 
 * @param {string} open - Opening bracket character
 * @param {string} close - Closing bracket character
 * @returns {boolean} Whether brackets are balanced
 */
const isBalanced = (str, open, close) => {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === open) count++;
    else if (str[i] === close) count--;
    if (count < 0) return false;  // More closing than opening
  }
  return count === 0;  // Should be exactly balanced
};

/**
 * Fix unbalanced brackets in a string
 * @param {string} str - String with unbalanced brackets
 * @param {string} open - Opening bracket character
 * @param {string} close - Closing bracket character
 * @returns {string} String with fixed brackets
 */
const fixUnbalancedBrackets = (str, open, close) => {
  let count = 0;
  
  // Count brackets
  for (let i = 0; i < str.length; i++) {
    if (str[i] === open) count++;
    else if (str[i] === close) count--;
  }
  
  // Add missing closing brackets
  if (count > 0) {
    return str + close.repeat(count);
  }
  
  // Add missing opening brackets at the beginning
  if (count < 0) {
    return open.repeat(-count) + str;
  }
  
  return str;
};

/**
 * Attempt to repair broken JSON by handling common issues
 * @param {string} str - Broken JSON string
 * @returns {string} Repaired JSON string
 */
const repairBrokenJSON = (str) => {
  // Fix common JS errors seen in error logs
  
  // 1. Try to fix incomplete property values
  str = str.replace(/([:,]\s*)([a-zA-Z0-9_]+)(,|$)/g, (match, pre, value, post) => {
    // Convert true/false/null literals
    if (value === 'true') return `${pre}true${post}`;
    if (value === 'false') return `${pre}false${post}`;
    if (value === 'null') return `${pre}null${post}`;
    // Other values get quoted
    return `${pre}"${value}"${post}`;
  });
  
  // 2. Try to fix missing quotes in property values
  str = str.replace(/:\s*([^",\s{}[\]]+)(\s*[,}])/g, ':"$1"$2');
  
  // 3. Fix property names with single quotes
  str = str.replace(/(['"])([\w\s]+)\1\s*:/g, '"$2":');
  
  // 4. Remove extra punctuation
  str = str.replace(/,\s*([}\]])/g, '$1');
  
  return str;
};
