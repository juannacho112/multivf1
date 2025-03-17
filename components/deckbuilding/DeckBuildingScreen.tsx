import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { ThemedView } from '../ThemedView';
import { ThemedText } from '../ThemedText';
import { CardComponent } from '../veefriends/CardComponent';
import { fullCardPool, RARITY_POINTS, calculateRarityPoints, generateRandomDeck } from '../../data/cardData';
import { Card, Rarity } from '../../models/Card';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeckNavigation } from '../../contexts/NavigationContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_CARDS = 20;
const MAX_RARITY_POINTS = 15;

interface DeckBuildingScreenProps {
  onDeckConfirm?: (deck: Card[]) => void; // Made optional as we may use context
  playerName: string;
  initialDeck?: Card[];
}

export const DeckBuildingScreen: React.FC<DeckBuildingScreenProps> = ({
  onDeckConfirm,
  playerName,
  initialDeck
}) => {
  const insets = useSafeAreaInsets();
  const { goBack } = useDeckNavigation();
  const [cardPool, setCardPool] = useState<Card[]>(fullCardPool);
  const [selectedDeck, setSelectedDeck] = useState<Card[]>(initialDeck || []);
  const [currentRarityPoints, setCurrentRarityPoints] = useState<number>(0);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<Rarity | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'skill' | 'stamina' | 'aura' | 'total'>('name');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pool' | 'deck'>('pool');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Compute current rarity points when selected deck changes
  useEffect(() => {
    const points = calculateRarityPoints(selectedDeck);
    setCurrentRarityPoints(points);
  }, [selectedDeck]);
  
  // Simulate loading delay for initial data processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle deck confirmation
  const handleDeckConfirm = () => {
    if (selectedDeck.length > 0 && onDeckConfirm) {
      onDeckConfirm(selectedDeck);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    if (goBack) {
      goBack();
    }
  };

  // Filter and sort the card pool
  const filteredCardPool = cardPool
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
    if (selectedDeck.length >= MAX_CARDS) return false;
    
    const cardPoints = RARITY_POINTS[card.rarity];
    if (currentRarityPoints + cardPoints > MAX_RARITY_POINTS) return false;
    
    // Check if card is already in deck
    return !selectedDeck.some(deckCard => deckCard.id === card.id);
  };
  
  // Add a card to the deck
  const addCardToDeck = (card: Card) => {
    if (!canAddToDeck(card)) return;
    setSelectedDeck([...selectedDeck, card]);
  };
  
  // Remove a card from the deck
  const removeCardFromDeck = (cardId: string) => {
    setSelectedDeck(selectedDeck.filter(card => card.id !== cardId));
  };
  
  // Generate random deck
  const generateDeck = () => {
    const randomDeck = generateRandomDeck(cardPool, MAX_CARDS, MAX_RARITY_POINTS);
    setSelectedDeck(randomDeck);
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
      default: return '#9E9E9E';
    }
  };
  
  // Get color for rarity
  const getRarityColor = (rarity: Rarity): string => {
    switch (rarity) {
      case 'common': return '#A9A9A9';
      case 'rare': return '#4682B4';
      case 'very_rare': return '#9370DB';
      case 'epic': return '#FF8C00';
      case 'spectacular': return '#FF1493';
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
    const types = [...new Set(cardPool.map(card => card.type))].filter(Boolean) as string[];
    
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
          
          {(['common', 'rare', 'very_rare', 'epic', 'spectacular'] as Rarity[]).map(rarity => (
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
      </View>
    );
  };
  
  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText style={styles.loadingText}>Preparing Card Library...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#4285F4" />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.title}>
          {`${playerName}'s Deck Building`}
        </ThemedText>
        <TouchableOpacity 
          style={[styles.confirmButton, selectedDeck.length === 0 && styles.disabledButton]} 
          onPress={handleDeckConfirm}
          disabled={selectedDeck.length === 0}
        >
          <ThemedText style={styles.confirmButtonText}>
            {selectedDeck.length === 0 ? 'Need Cards' : 'Confirm Deck'}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.deckInfo}>
        <View style={styles.deckStats}>
          <ThemedText style={styles.deckStatText}>
            Cards: {selectedDeck.length}/{MAX_CARDS}
          </ThemedText>
          <ThemedText style={styles.deckStatText}>
            Rarity Points: {currentRarityPoints}/{MAX_RARITY_POINTS}
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.randomButton} 
          onPress={generateDeck}
        >
          <Ionicons name="shuffle" size={16} color="#FFF" />
          <ThemedText style={styles.randomButtonText}>Random Deck</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pool' && styles.activeTab]}
          onPress={() => setActiveTab('pool')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'pool' && styles.activeTabText]}>
            Card Pool ({cardPool.length})
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deck' && styles.activeTab]}
          onPress={() => setActiveTab('deck')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'deck' && styles.activeTabText]}>
            Your Deck ({selectedDeck.length})
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
        />
      ) : (
        <FlatList
          data={selectedDeck}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderCardItem(item, true)}
          contentContainerStyle={styles.cardsList}
          ListEmptyComponent={
            <View style={styles.emptyDeck}>
              <ThemedText style={styles.emptyDeckText}>
                Your deck is empty. Add cards from the pool to build your deck!
              </ThemedText>
              <TouchableOpacity 
                style={styles.randomButton} 
                onPress={generateDeck}
              >
                <Ionicons name="shuffle" size={16} color="#FFF" />
                <ThemedText style={styles.randomButtonText}>Generate Random Deck</ThemedText>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
  deckInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  deckStats: {
    flexDirection: 'column',
  },
  deckStatText: {
    marginVertical: 2,
  },
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5C6BC0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  randomButtonText: {
    color: '#FFF',
    marginLeft: 4,
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
    marginBottom: 20,
    fontSize: 16,
    color: '#757575',
  },
});
