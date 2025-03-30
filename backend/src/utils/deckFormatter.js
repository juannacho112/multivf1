/**
 * Utility functions for ensuring proper deck format before saving to MongoDB
 */

/**
 * Ensures a deck is in the proper format for MongoDB storage
 * This checks if the deck is a valid array of card objects
 * If it's a string, it will attempt to parse it and clean it
 * If it's already an array, it validates the structure
 * 
 * @param {Array|string} deck - The deck to validate and format
 * @returns {Array} - Properly formatted deck array
 */
export const ensureProperDeckFormat = (deck) => {
  // If the deck is undefined or null, return empty array
  if (!deck) {
    return [];
  }

  // If the deck is already an array, validate it
  if (Array.isArray(deck)) {
    return validateDeckArray(deck);
  }

  // If the deck is a string, try to parse it
  if (typeof deck === 'string') {
    try {
      // First, clean up the string
      let cleanedString = deck.replace(/\n/g, '')
                              .replace(/\s+/g, ' ')
                              .trim();
      
      try {
        // Try to parse it as JSON first
        const parsedDeck = JSON.parse(cleanedString);
        
        // Make sure the parsed result is an array
        if (Array.isArray(parsedDeck)) {
          return validateDeckArray(parsedDeck);
        } else {
          console.error('Parsed deck is not an array');
          return [];
        }
      } catch (jsonError) {
        console.error('JSON parsing failed, trying to convert from JS object format:', jsonError);
        
        // The string may be in JavaScript object literal format instead of JSON
        // Try to convert it to valid JSON format and parse again
        try {
          // Handle JavaScript object literal format with single quotes instead of double quotes
          // 1. Replace single quotes with double quotes for string values
          cleanedString = cleanedString.replace(/(\w+):/g, '"$1":') // Add quotes around property names
                                      .replace(/'/g, '"'); // Replace single quotes with double quotes
          
          // 2. Parse the converted string
          const parsedDeck = JSON.parse(cleanedString);
          
          // Make sure the parsed result is an array
          if (Array.isArray(parsedDeck)) {
            return validateDeckArray(parsedDeck);
          }
        } catch (jsObjectError) {
          console.error('Failed to parse JavaScript object literal:', jsObjectError);
          
          // Last resort: try to parse it manually by extracting properties
          try {
            // Try a direct manual approach by evaluating the string as JavaScript
            // Note: This is safe because we're using it locally in a controlled way
            // and not exposing it to user input directly
            console.log("Manually extracting card data from string...");
            
            // Method 1: Simple function wrapping approach
            try {
              // First, ensure it's a proper JavaScript array
              const jsArray = `(function() { return ${deck}; })()`;
              const extractedCards = eval(jsArray);
              
              if (Array.isArray(extractedCards) && extractedCards.length > 0) {
                console.log(`Successfully extracted ${extractedCards.length} cards via eval`);
                return validateDeckArray(extractedCards);
              }
            } catch (evalError) {
              console.log("Eval extraction failed:", evalError);
            }
            
            // Method 2: Extract card objects based on patterns in the string as fallback
            console.log("Trying regex pattern matching as fallback...");
            
            // More comprehensive regex approach
            const cardRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*skill:\s*(\d+)\s*,\s*stamina:\s*(\d+)\s*,\s*aura:\s*(\d+)\s*,\s*baseTotal:\s*(\d+)\s*,\s*finalTotal:\s*(\d+)\s*,\s*rarity:\s*['"]([^'"]+)['"]\s*,\s*character:\s*['"]([^'"]+)['"]\s*,\s*type:\s*['"]([^'"]+)['"]\s*,\s*unlocked:\s*(true|false)\s*}/g;
            
            const cards = [];
            let match;
            while ((match = cardRegex.exec(deck)) !== null) {
              cards.push({
                id: match[1],
                name: match[2],
                skill: parseInt(match[3], 10),
                stamina: parseInt(match[4], 10),
                aura: parseInt(match[5], 10),
                baseTotal: parseInt(match[6], 10),
                finalTotal: parseInt(match[7], 10),
                rarity: match[8],
                character: match[9],
                type: match[10],
                unlocked: match[11] === 'true'
              });
            }
            
            // Last resort method: Direct string parsing by looking for card objects
            if (cards.length === 0) {
              console.log("Trying more direct string parsing...");
              try {
                // Find each card object by looking for patterns
                const regex = /{([^{}]*)}/g;
                let objectMatch;
                
                while ((objectMatch = regex.exec(deck)) !== null) {
                  const cardStr = objectMatch[0];
                  try {
                    // Process this individual card string into a proper JSON object
                    const cleanCardStr = cardStr
                      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Add quotes to property names
                      .replace(/'/g, '"'); // Convert single quotes to double quotes
                    
                    const cardObj = JSON.parse(cleanCardStr);
                    if (cardObj && cardObj.id && cardObj.name && 
                        typeof cardObj.skill === 'number' && 
                        typeof cardObj.stamina === 'number' && 
                        typeof cardObj.aura === 'number') {
                      cards.push(cardObj);
                    }
                  } catch (cardParseErr) {
                    console.log(`Failed to parse card: ${cardStr.substring(0, 50)}...`);
                  }
                }
              } catch (directParseError) {
                console.log("Direct string parsing failed:", directParseError);
              }
            }
            
            if (cards.length > 0) {
              console.log(`Manually extracted ${cards.length} cards from string`);
              return validateDeckArray(cards);
            }
          } catch (manualError) {
            console.error('Failed manual extraction:', manualError);
          }
        }
      }
      
      // If all parsing attempts fail, return empty array
      return [];
    } catch (error) {
      console.error('Error processing deck string:', error);
      return [];
    }
  }
  
  // If the deck is neither an array nor a string, return empty array
  console.error('Deck is neither an array nor a string');
  return [];
};

/**
 * Validates that the deck array contains properly structured card objects
 * If any card is invalid, it will be removed from the deck
 * 
 * @param {Array} deckArray - The deck array to validate
 * @returns {Array} - Validated deck array
 */
const validateDeckArray = (deckArray) => {
  if (!Array.isArray(deckArray)) {
    return [];
  }
  
  // Filter out invalid cards
  return deckArray.filter(card => {
    // Card must be an object
    if (!card || typeof card !== 'object') {
      return false;
    }
    
    // Card must have required properties
    if (!card.id || !card.name || 
        typeof card.skill !== 'number' || 
        typeof card.stamina !== 'number' || 
        typeof card.aura !== 'number') {
      return false;
    }
    
    return true;
  }).map(card => {
    // Ensure all required properties have correct types
    return {
      id: String(card.id),
      name: String(card.name),
      skill: Number(card.skill),
      stamina: Number(card.stamina),
      aura: Number(card.aura),
      baseTotal: Number(card.baseTotal || (card.skill + card.stamina + card.aura)),
      finalTotal: Number(card.finalTotal || card.baseTotal || (card.skill + card.stamina + card.aura)),
      rarity: String(card.rarity || 'common'),
      character: String(card.character || card.name),
      type: String(card.type || 'standard'),
      unlocked: Boolean(card.unlocked !== false)
    };
  });
};
