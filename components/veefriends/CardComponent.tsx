import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card } from '../../models/Card';
import { Ionicons } from '@expo/vector-icons';

interface CardComponentProps {
  card: Card | null;
  faceDown?: boolean;
  onPress?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  faceDown = false,
  onPress,
}) => {
  // If no card is provided, show an empty card placeholder
  if (!card) {
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.emptyCard]}>
          <ThemedText style={styles.emptyCardText}>No Card</ThemedText>
        </View>
      </View>
    );
  }

  // Render rarity badge based on card rarity
  const renderRarityBadge = () => {
    let color = '#A9A9A9'; // Default for common
    
    switch (card.rarity) {
      case 'common':
        color = '#A9A9A9'; // Gray
        break;
      case 'rare':
        color = '#4682B4'; // Steel Blue
        break;
      case 'very_rare':
        color = '#9370DB'; // Medium Purple
        break;
      case 'epic':
        color = '#FF8C00'; // Dark Orange
        break;
      case 'spectacular':
        color = '#FF1493'; // Deep Pink
        break;
    }

    return (
      <View style={[styles.rarityBadge, { backgroundColor: color }]}>
        <ThemedText style={styles.rarityText}>
          {card.rarity.replace('_', ' ')}
        </ThemedText>
      </View>
    );
  };

  // Render the card face down (back of card)
  if (faceDown) {
    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.card, styles.cardBack]}>
          <View style={styles.cardBackPattern}>
            <Ionicons name="help-circle" size={50} color="#FFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Calculate stat bars width percentages
  const maxStat = 25; // Maximum possible stat value
  const skillWidth = Math.min(100, (card.skill / maxStat) * 100);
  const staminaWidth = Math.min(100, (card.stamina / maxStat) * 100);
  const auraWidth = Math.min(100, (card.aura / maxStat) * 100);
  
  // Render the card face up
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.card}>
        {/* Card Header: Name and Rarity */}
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardName}>{card.name}</ThemedText>
          {renderRarityBadge()}
        </View>

        {/* Card Image Placeholder */}
        <View style={styles.imageContainer}>
          {/* If we had real images, we would use:
            <Image 
              source={{ uri: card.imageUrl }} 
              style={styles.cardImage}
              resizeMode="contain"
            />
          */}
          <View style={styles.imagePlaceholder}>
            <Ionicons 
              name={getIconForName(card.name)} 
              size={60} 
              color="#FFF" 
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="flash" size={16} color="#FF9800" />
              <ThemedText style={styles.statText}>Skill</ThemedText>
            </View>
            <View style={styles.statBarContainer}>
              <View style={[styles.statBar, { width: `${skillWidth}%`, backgroundColor: '#FF9800' }]} />
            </View>
            <ThemedText style={styles.statValue}>{card.skill}</ThemedText>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="fitness" size={16} color="#4CAF50" />
              <ThemedText style={styles.statText}>Stamina</ThemedText>
            </View>
            <View style={styles.statBarContainer}>
              <View style={[styles.statBar, { width: `${staminaWidth}%`, backgroundColor: '#4CAF50' }]} />
            </View>
            <ThemedText style={styles.statValue}>{card.stamina}</ThemedText>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="sparkles" size={16} color="#2196F3" />
              <ThemedText style={styles.statText}>Aura</ThemedText>
            </View>
            <View style={styles.statBarContainer}>
              <View style={[styles.statBar, { width: `${auraWidth}%`, backgroundColor: '#2196F3' }]} />
            </View>
            <ThemedText style={styles.statValue}>{card.aura}</ThemedText>
          </View>
        </View>

        {/* Total Section */}
        <View style={styles.totalContainer}>
          <ThemedText style={styles.totalLabel}>Total</ThemedText>
          <ThemedText style={styles.totalValue}>{card.finalTotal}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Helper function to get icon based on card name
function getIconForName(name: string): any {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('lion')) return 'paw';
  if (lowerName.includes('eagle')) return 'airplane';
  if (lowerName.includes('tiger')) return 'paw';
  if (lowerName.includes('wolf')) return 'paw';
  if (lowerName.includes('dragon')) return 'flame';
  if (lowerName.includes('phoenix')) return 'flame';
  if (lowerName.includes('unicorn')) return 'star';
  if (lowerName.includes('pegasus')) return 'airplane';
  if (lowerName.includes('chimera')) return 'warning';
  if (lowerName.includes('kraken')) return 'water';
  
  return 'shapes'; // Default icon
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    perspective: '1000px', // For 3D flip effect
  },
  card: {
    width: 200,
    height: 300,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBack: {
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackPattern: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFF',
    borderRadius: 8,
    opacity: 0.8,
  },
  emptyCard: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyCardText: {
    color: '#9E9E9E',
    fontSize: 18,
    fontStyle: 'italic',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  imageContainer: {
    height: 120,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#E0E0E0',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  statsContainer: {
    marginVertical: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  statBar: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    width: 20,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginTop: 'auto',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
