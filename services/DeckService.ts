import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, SavedDeck } from '../models/Card';
import { fullCardPool, isCharacterInDeck, calculateRarityPoints } from '../data/cardData';

// Keys for AsyncStorage
const SAVED_DECKS_KEY = 'SAVED_DECKS';
const UNLOCKED_CARDS_KEY = 'UNLOCKED_CARDS';

// Max allowed cards per deck
const MAX_CARDS = 20;
// Max allowed rarity points per deck
const MAX_RARITY_POINTS = 15;

export class DeckService {
  // Get all saved decks
  static async getSavedDecks(): Promise<SavedDeck[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(SAVED_DECKS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading saved decks:', error);
      return [];
    }
  }

  // Save a deck
  static async saveDeck(deck: SavedDeck): Promise<boolean> {
    try {
      // Get existing decks
      const existingDecks = await this.getSavedDecks();
      
      // Check if we're updating an existing deck or adding a new one
      const deckIndex = existingDecks.findIndex(d => d.id === deck.id);
      
      if (deckIndex >= 0) {
        // Update existing deck
        existingDecks[deckIndex] = {
          ...deck,
          dateModified: new Date().toISOString()
        };
      } else {
        // Add new deck
        existingDecks.push({
          ...deck,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString()
        });
      }
      
      // Save back to storage
      await AsyncStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(existingDecks));
      
      return true;
    } catch (error) {
      console.error('Error saving deck:', error);
      return false;
    }
  }

  // Delete a deck
  static async deleteDeck(deckId: string): Promise<boolean> {
    try {
      // Get existing decks
      const existingDecks = await this.getSavedDecks();
      
      // Filter out the deck to delete
      const updatedDecks = existingDecks.filter(d => d.id !== deckId);
      
      // Save back to storage
      await AsyncStorage.setItem(SAVED_DECKS_KEY, JSON.stringify(updatedDecks));
      
      return true;
    } catch (error) {
      console.error('Error deleting deck:', error);
      return false;
    }
  }

  // Get a single deck by ID
  static async getDeckById(deckId: string): Promise<SavedDeck | null> {
    try {
      const decks = await this.getSavedDecks();
      return decks.find(d => d.id === deckId) || null;
    } catch (error) {
      console.error('Error loading deck:', error);
      return null;
    }
  }

  // Validate a deck against game rules
  static validateDeck(deck: Card[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check deck size
    if (deck.length > MAX_CARDS) {
      errors.push(`Deck exceeds the maximum of ${MAX_CARDS} cards`);
    }
    
    // Check rarity points
    const rarityPoints = calculateRarityPoints(deck);
    if (rarityPoints > MAX_RARITY_POINTS) {
      errors.push(`Deck exceeds the maximum of ${MAX_RARITY_POINTS} rarity points`);
    }
    
    // Check for duplicate characters
    const characters = deck.map(card => card.character);
    const uniqueCharacters = new Set(characters);
    if (characters.length !== uniqueCharacters.size) {
      errors.push('Deck contains duplicate characters');
    }
    
    // Check for locked cards
    const hasLockedCards = deck.some(card => !card.unlocked);
    if (hasLockedCards) {
      errors.push('Deck contains locked cards');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Get unlocked status for cards
  static async getUnlockedCards(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(UNLOCKED_CARDS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading unlocked cards:', error);
      return [];
    }
  }
  
  // Unlock a card by ID
  static async unlockCard(cardId: string): Promise<boolean> {
    try {
      // Get currently unlocked cards
      const unlockedCards = await this.getUnlockedCards();
      
      // Add the new card ID if it's not already there
      if (!unlockedCards.includes(cardId)) {
        unlockedCards.push(cardId);
      }
      
      // Save back to storage
      await AsyncStorage.setItem(UNLOCKED_CARDS_KEY, JSON.stringify(unlockedCards));
      
      return true;
    } catch (error) {
      console.error('Error unlocking card:', error);
      return false;
    }
  }
  
  // Get the full card pool with current unlock status
  static async getFullCardPool(): Promise<Card[]> {
    // Get unlocked card IDs
    const unlockedCardIds = await this.getUnlockedCards();
    
    // Update the unlock status of all cards
    return fullCardPool.map(card => {
      // Cards that are already unlocked by default or explicitly unlocked
      const isUnlocked = card.unlocked || unlockedCardIds.includes(card.id);
      return {
        ...card,
        unlocked: isUnlocked
      };
    });
  }
  
  // Create a new empty deck
  static createEmptyDeck(name: string): SavedDeck {
    return {
      id: `deck_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      cards: [],
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };
  }
  
  // Check if a card can be added to a deck
  static canAddCardToDeck(deck: Card[], card: Card): { canAdd: boolean; reason?: string } {
    // Check if deck is full
    if (deck.length >= MAX_CARDS) {
      return { canAdd: false, reason: `Deck is full (max ${MAX_CARDS} cards)` };
    }
    
    // Check if adding this card would exceed rarity points
    const currentRarityPoints = calculateRarityPoints(deck);
    const rarityPointsWithNewCard = currentRarityPoints + (card.rarity === 'common' ? 0 : 1);
    if (rarityPointsWithNewCard > MAX_RARITY_POINTS) {
      return { canAdd: false, reason: `Would exceed the maximum ${MAX_RARITY_POINTS} rarity points` };
    }
    
    // Check if character is already in deck
    if (isCharacterInDeck(deck, card.character)) {
      return { canAdd: false, reason: `${card.character} is already in the deck` };
    }
    
    // Check if card is unlocked
    if (!card.unlocked) {
      return { canAdd: false, reason: `Card is locked` };
    }
    
    return { canAdd: true };
  }
}
