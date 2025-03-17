import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, SavedDeck } from '../../models/Card';
import { DeckService } from '../../services/DeckService';
import { RARITY_POINTS, isCharacterInDeck } from '../../data/cardData';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useDeckNavigation } from '../../contexts/NavigationContext';
import { BackButton } from '../ui/BackButton';

const MAX_CARDS = 20;
const MAX_RARITY_POINTS = 15;

interface DeckEditorScreenProps {
  route: {
    params: {
      deckId: string;
    };
  };
  navigation?: any; // Making this optional as we'll use context instead
}

export const DeckEditorScreen: React.FC<DeckEditorScreenProps> = ({ route, navigation }) => {
  const { deckId } = route.params;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { goBack } = useDeckNavigation();
  
  const [cardPool, setCardPool] = useState<Card[]>([]);
  const [deck, setDeck] = useState<SavedDeck | null>(null);
  const [currentRarityPoints, setCurrentRarityPoints] = useState<number>(0);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'skill' | 'stamina' | 'aura' | 'total'>('name');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pool' | 'deck'>('deck');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deckName, setDeckName] = useState<string>('');
  const [showNameEditor, setShowNameEditor] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Load deck and card pool
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load the deck
        const savedDeck = await DeckService.getDeckById(deckId);
        if (!savedDeck) {
          Alert.alert('Error', 'Deck not found');
          handleGoBack();
          return;
        }
        
        setDeck(savedDeck);
        setDeckName(savedDeck.name);
        
        // Load the card pool with unlocked status
        const pool = await DeckService.getFullCardPool();
        setCardPool(pool);
        
        // Calculate rarity points
        const points = savedDeck.cards.reduce(
          (total, card) => total + RARITY_POINTS[card.rarity], 0
        );
        setCurrentRarityPoints(points);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error loading deck:', error);
        Alert.alert('Error', 'Failed to load deck');
        handleGoBack();
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [deckId]);
  
  // Use the appropriate navigation method
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { text: 'Don\'t Save', style: 'destructive', onPress: navigateBack },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: async () => { await handleSaveDeck(); navigateBack(); } }
        ]
      );
    } else {
      navigateBack();
    }
  };

  const navigateBack = () => {
    if (goBack) {
      goBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };
  
  // Save changes to the deck
  const handleSaveDeck = useCallback(async () => {
    if (!deck) return;
    
    setSaving(true);
    try {
      await DeckService.saveDeck({
        ...deck,
        name: deckName,
      });
      Alert.alert('Success', 'Deck saved successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving deck:', error);
      Alert.alert('Error', 'Failed to save deck');
    } finally {
      setSaving(false);
    }
  }, [deck, deckName]);
  
  // Update deck name
  const handleUpdateName = useCallback(() => {
    if (!deckName.trim()) {
      Alert.alert('Error', 'Deck name cannot be empty');
      return;
    }
    
    if (deck) {
      setDeck({
        ...deck,
        name: deckName,
      });
      setShowNameEditor(false);
      setHasUnsavedChanges(true);
    }
  }, [deckName, deck]);
  
  // Filter and sort the card pool
  const filteredCardPool = cardPool
    .filter(card => card.unlocked) // Only show unlocked cards
    .filter(card => !filterType || card.type === filterType)
    .filter(card => !filterRarity || card.rarity === filterRarity)
    .filter(card => card.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'type') {
        const aType = a.type as string || '';
        const bType = b.type as string || '';
        return aType.localeCompare(bType);
      }
      // For numeric stats, handle undefined values with fallbacks
      return (b[sortBy] as number || 0) - (a[sortBy] as number || 0);
    });
  
  // Check if a card can be added to the deck
  const canAddToDeck = (card: Card): boolean => {
    if (!deck) return false;
    
    if (deck.cards.length >= MAX_CARDS) return false;
    
    const cardPoints = RARITY_POINTS[card.rarity];
    if (currentRarityPoints + cardPoints > MAX_RARITY_POINTS) return false;
    
    // Check if character is already in deck
    return !deck.cards.some(deckCard => deckCard.character === card.character);
  };
  
  // Add a card to the deck
  const addCardToDeck = (card: Card) => {
    if (!deck || !canAddToDeck(card)) return;
    
    const updatedCards = [...deck.cards, card];
    setDeck({
      ...deck,
      cards: updatedCards,
    });
    
    // Update rarity points
    setCurrentRarityPoints(currentRarityPoints + RARITY_POINTS[card.rarity]);
    setHasUnsavedChanges(true);
  };
  
  // Remove a card from the deck
  const removeCardFromDeck = (cardId: string) => {
    if (!deck) return;
    
    const cardToRemove = deck.cards.find(card => card.id === cardId);
    if (!cardToRemove) return;
    
    const updatedCards = deck.cards.filter(card => card.id !== cardId);
    setDeck({
      ...deck,
      cards: updatedCards,
    });
    
    // Update rarity points
    setCurrentRarityPoints(currentRarityPoints - RARITY_POINTS[cardToRemove.rarity]);
    setHasUnsavedChanges(true);
  };
  
  // Get color for card type
  const getTypeColor = (type: string | undefined): string => {
    switch (type) {
      case 'forest': return '#4CAF50';
      case 'mythical': return '#9C27B0';
      case 'ocean': return '#2196F3';
      case 'desert': return '#FF9800';
      case 'insect': return '#8BC34A';
      case 'legendary': return '#E91E63';
      case 'character': return '#3F51B5';
      case 'special': return '#FFD700';
      default: return '#9E9E9E';
    }
  };
  
  // Get color for rarity
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return colors.rarity.common;
      case 'rare': return colors.rarity.rare;
      case 'very_rare': return colors.rarity.very_rare;
      case 'epic': return colors.rarity.epic;
      case 'spectacular': return colors.rarity.spectacular;
      default: return '#9E9E9E';
    }
  };
  
  // Render card item in list
  const renderCardItem = (card: Card, inDeck: boolean = false) => {
    return (
      <View style={styles.cardListItem}>
        <View style={styles.cardPreview}>
          <View style={[styles.cardBackground, { backgroundColor: getTypeColor(card.type) }]}>
            <ThemedText style={styles.cardName}>{card.name}</ThemedText>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
              <ThemedText style={styles.rarityText}>
                {card.rarity.replace('_', ' ')}
              </ThemedText>
            </View>
            <View style={styles.statsRow}>
              <ThemedText style={styles.statText}>S: {card.skill}</ThemedText>
              <ThemedText style={styles.statText}>ST: {card.stamina}</ThemedText>
              <ThemedText style={styles.statText}>A: {card.aura}</ThemedText>
            </View>
            <ThemedText style={styles.totalText}>Total: {card.finalTotal}</ThemedText>
          </View>
        </View>
        <View style={styles.cardActions}>
          {inDeck ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => removeCardFromDeck(card.id)}
            >
              <Ionicons name="remove-circle" size={16} color="#FFF" />
              <ThemedText style={styles.buttonText}>Remove</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                canAddToDeck(card) ? styles.addButton : styles.disabledButton
              ]}
              onPress={() => addCardToDeck(card)}
              disabled={!canAddToDeck(card)}
            >
              <Ionicons 
                name="add-circle" 
                size={16} 
                color={canAddToDeck(card) ? '#FFF' : '#999'} 
              />
              <ThemedText style={styles.buttonText}>
                {canAddToDeck(card) ? 'Add' : 'Cannot Add'}
              </ThemedText>
            </TouchableOpacity>
          )}
          <View style={styles.rarityPointBadge}>
            <ThemedText style={styles.rarityPointText}>
              {RARITY_POINTS[card.rarity]} RP
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };
  
  // Render the filter section
  const renderFilters = () => {
    // Available card types
    const types = Array.from(new Set(cardPool.map(card => card.type))).filter(Boolean) as string[];
    
    return (
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === null && styles.activeFilterButton
            ]}
            onPress={() => setFilterType(null)}
          >
            <ThemedText style={styles.filterText}>All Types</ThemedText>
          </TouchableOpacity>
          
          {types.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                filterType === type && styles.activeFilterButton,
                { backgroundColor: `${getTypeColor(type)}40` }
              ]}
              onPress={() => setFilterType(type)}
            >
              <ThemedText style={styles.filterText}>{type.charAt(0).toUpperCase() + type.slice(1)}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterRarity === null && styles.activeFilterButton
            ]}
            onPress={() => setFilterRarity(null)}
          >
            <ThemedText style={styles.filterText}>All Rarities</ThemedText>
          </TouchableOpacity>
          
          {(['common', 'rare', 'very_rare', 'epic', 'spectacular']).map(rarity => (
            <TouchableOpacity
              key={rarity}
              style={[
                styles.filterButton,
                filterRarity === rarity && styles.activeFilterButton,
                { backgroundColor: `${getRarityColor(rarity)}40` }
              ]}
              onPress={() => setFilterRarity(rarity)}
            >
              <ThemedText style={styles.filterText}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1).replace('_', ' ')}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search cards..."
              placeholderTextColor={colors.darkGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading deck...</ThemedText>
      </ThemedView>
    );
  }
  
  if (!deck) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.errorText}>Deck not found</ThemedText>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={navigateBack}
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton 
            onPress={handleGoBack} 
            requireConfirmation={hasUnsavedChanges} 
          />
          
          {showNameEditor ? (
            <View style={styles.nameEditorContainer}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderColor: colors.mediumGray }]}
                value={deckName}
                onChangeText={(newName) => {
                  setDeckName(newName);
                  setHasUnsavedChanges(true);
                }}
                autoFocus
                maxLength={30}
              />
              <TouchableOpacity
                style={[styles.nameActionButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateName}
              >
                <Ionicons name="checkmark" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nameActionButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  setDeckName(deck.name);
                  setShowNameEditor(false);
                }}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.titleContainer}
              onPress={() => setShowNameEditor(true)}
            >
              <ThemedText type="subtitle" style={styles.title}>
                {deck.name}
              </ThemedText>
              <Ionicons name="pencil" size={16} color={colors.primary} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.saveButton, 
            saving && styles.savingButton,
            hasUnsavedChanges && styles.hasChangesButton
          ]}
          onPress={handleSaveDeck}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons 
                name="save-outline" 
                size={20} 
                color={hasUnsavedChanges ? "#FFFFFF" : "#4CAF50"} 
              />
              <ThemedText 
                style={[
                  styles.saveButtonText, 
                  { color: hasUnsavedChanges ? "#FFFFFF" : "#4CAF50" }
                ]}
              >
                Save
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.deckInfo}>
        <View style={styles.deckStats}>
          <ThemedText style={styles.deckStatText}>
            Cards: {deck.cards.length}/{MAX_CARDS}
          </ThemedText>
          <ThemedText style={styles.deckStatText}>
            Rarity Points: {currentRarityPoints}/{MAX_RARITY_POINTS}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deck' && styles.activeTab]}
          onPress={() => setActiveTab('deck')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'deck' && styles.activeTabText]}>
            Deck ({deck.cards.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pool' && styles.activeTab]}
          onPress={() => setActiveTab('pool')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'pool' && styles.activeTabText]}>
            Card Pool
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'pool' && renderFilters()}
      
      {activeTab === 'pool' ? (
        <FlatList
          data={filteredCardPool}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderCardItem(item)}
          contentContainerStyle={styles.cardsList}
          initialNumToRender={10}
        />
      ) : (
        <FlatList
          data={deck.cards}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderCardItem(item, true)}
          contentContainerStyle={styles.cardsList}
          ListEmptyComponent={
            <View style={styles.emptyDeck}>
              <ThemedText style={styles.emptyDeckText}>
                Your deck is empty. Add cards from the card pool to build your deck!
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#F44336',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editIcon: {
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F1F8E9',
  },
  hasChangesButton: {
    backgroundColor: '#4CAF50',
  },
  savingButton: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    fontWeight: '500',
    marginLeft: 4,
  },
  nameEditorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
  },
  nameActionButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  deckInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deckStatText: {
    marginVertical: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4285F4',
  },
  filterSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeFilterButton: {
    backgroundColor: '#4285F4',
  },
  filterText: {
    fontWeight: '500',
    fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
  },
  cardsList: {
    padding: 12,
  },
  cardListItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPreview: {
    flex: 1,
  },
  cardBackground: {
    borderRadius: 6,
    padding: 8,
    position: 'relative',
  },
  cardName: {
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 70, // Make space for rarity badge
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 12,
  },
  totalText: {
    marginTop: 4,
    color: '#FFF',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginVertical: 2,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
  },
  rarityPointBadge: {
    backgroundColor: '#607D8B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 8,
  },
  rarityPointText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyDeck: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyDeckText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
  },
});
