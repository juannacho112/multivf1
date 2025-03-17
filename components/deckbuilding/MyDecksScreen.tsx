import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedDeck } from '../../models/Card';
import { DeckService } from '../../services/DeckService';
import { useDeckNavigation } from '../../contexts/NavigationContext';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BackButton } from '../ui/BackButton';

export const MyDecksScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { navigateToDeckEditor } = useDeckNavigation();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  
  // Load saved decks on mount
  useEffect(() => {
    loadDecks();
  }, []);
  
  const loadDecks = async () => {
    setLoading(true);
    try {
      const savedDecks = await DeckService.getSavedDecks();
      setDecks(savedDecks);
    } catch (error) {
      console.error('Failed to load decks:', error);
      Alert.alert('Error', 'Failed to load decks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) {
      Alert.alert('Error', 'Please enter a deck name');
      return;
    }
    
    try {
      const newDeck = DeckService.createEmptyDeck(newDeckName);
      await DeckService.saveDeck(newDeck);
      
      // Close modal and reset input
      setShowNewDeckModal(false);
      setNewDeckName('');
      
      // Reload decks to show the new one
      loadDecks();
      
      // Navigate to the deck building screen with the new deck
      navigateToDeckEditor(newDeck.id);
    } catch (error) {
      console.error('Failed to create deck:', error);
      Alert.alert('Error', 'Failed to create deck');
    }
  };
  
  const handleDeleteDeck = async (deckId: string) => {
    Alert.alert(
      'Delete Deck',
      'Are you sure you want to delete this deck?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DeckService.deleteDeck(deckId);
              loadDecks(); // Reload decks after deletion
            } catch (error) {
              console.error('Failed to delete deck:', error);
              Alert.alert('Error', 'Failed to delete deck');
            }
          }
        }
      ]
    );
  };
  
  const handleEditDeck = (deck: SavedDeck) => {
    navigateToDeckEditor(deck.id);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Render a deck item in the list
  const renderDeckItem = ({ item }: { item: SavedDeck }) => {
    return (
      <TouchableOpacity
        style={[styles.deckItem, { backgroundColor: colors.lightGray }]}
        onPress={() => handleEditDeck(item)}
      >
        <View style={styles.deckInfo}>
          <View style={styles.deckNameRow}>
            <ThemedText type="subtitle" style={styles.deckName}>{item.name}</ThemedText>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDeck(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.deckStats}>
            <View style={styles.statBadge}>
              <Ionicons name="albums-outline" size={14} color={colors.text} />
              <ThemedText style={styles.statText}>{item.cards.length} cards</ThemedText>
            </View>
            
            <ThemedText style={styles.dateText}>
              Modified: {formatDate(item.dateModified)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton />
          <ThemedText type="subtitle" style={styles.title}>My Decks</ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowNewDeckModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <ThemedText style={styles.addButtonText}>New Deck</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Deck list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading your decks...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={decks}
          renderItem={renderDeckItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.deckList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={48} color={colors.text} />
              <ThemedText style={styles.emptyText}>No decks found.</ThemedText>
              <ThemedText style={styles.emptySubtext}>Create your first deck to get started!</ThemedText>
            </View>
          }
        />
      )}
      
      {/* New Deck Modal */}
      <Modal
        visible={showNewDeckModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewDeckModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>Create New Deck</ThemedText>
            
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.mediumGray }]}
              placeholder="Enter deck name"
              placeholderTextColor={colors.text + '80'}
              value={newDeckName}
              onChangeText={setNewDeckName}
              maxLength={30}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewDeckModal(false);
                  setNewDeckName('');
                }}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.createButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleCreateDeck}
                disabled={!newDeckName.trim()}
              >
                <ThemedText style={styles.createButtonText}>Create</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  deckList: {
    padding: 16,
  },
  deckItem: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deckNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 6,
  },
  deckInfo: {
    flex: 1,
  },
  deckStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  createButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
