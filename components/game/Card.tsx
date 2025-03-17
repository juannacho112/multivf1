import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Card as CardModel } from '../../models/Card';

// Get color based on rarity
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return '#A9A9A9';
    case 'rare': return '#4682B4';
    case 'very_rare': return '#9370DB';
    case 'epic': return '#FF8C00';
    case 'spectacular': return '#FF1493';
    default: return '#A9A9A9';
  }
};

interface CardProps {
  card: CardModel;
  onPress?: () => void;
  selected?: boolean;
  showDetails?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onPress, selected = false, showDetails = true }) => {
  const rarityColor = getRarityColor(card.rarity);
  
  // Get icon based on card type
  const getTypeIcon = () => {
    switch (card.type) {
      case 'forest': return 'leaf';
      case 'ocean': return 'water';
      case 'desert': return 'sunny';
      case 'mythical': return 'flame';
      case 'insect': return 'bug';
      case 'legendary': return 'star';
      default: return 'help-circle';
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        selected && styles.selected,
        { borderColor: rarityColor }
      ]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardName}>{card.name}</ThemedText>
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <ThemedText style={styles.rarityText}>
            {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1).replace('_', ' ')}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={[styles.cardImage, { backgroundColor: rarityColor + '33' }]}>
          <Ionicons name={getTypeIcon() as any} size={40} color={rarityColor} />
        </View>
        
        {showDetails && (
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Ionicons name="flash" size={16} color="#333" />
              <ThemedText style={styles.statLabel}>Skill</ThemedText>
              <ThemedText style={styles.statValue}>{card.skill}</ThemedText>
            </View>
            
            <View style={styles.statRow}>
              <Ionicons name="fitness" size={16} color="#333" />
              <ThemedText style={styles.statLabel}>Stamina</ThemedText>
              <ThemedText style={styles.statValue}>{card.stamina}</ThemedText>
            </View>
            
            <View style={styles.statRow}>
              <Ionicons name="sparkles" size={16} color="#333" />
              <ThemedText style={styles.statLabel}>Aura</ThemedText>
              <ThemedText style={styles.statValue}>{card.aura}</ThemedText>
            </View>
            
            <View style={[styles.statRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>TOTAL</ThemedText>
              <ThemedText style={styles.totalValue}>{card.finalTotal}</ThemedText>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <ThemedText style={styles.cardType}>
          {card.type ? card.type.charAt(0).toUpperCase() + card.type.slice(1) : 'Unknown'} Type
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180,
    height: 280,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rarityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flex: 1,
  },
  cardImage: {
    height: 80,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
    width: 30,
    textAlign: 'right',
  },
  totalRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    width: 30,
    textAlign: 'right',
    color: '#4CAF50',
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  cardType: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default Card;
