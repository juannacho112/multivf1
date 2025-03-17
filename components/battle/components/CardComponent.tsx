import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Card, CardRarity, cardTypeColors, rarityColors } from '../models/Card';

interface CardComponentProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
  isFlipped?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  showBack?: boolean;
  onSelect?: () => void;
  onPress?: () => void;
  style?: any;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  size = 'medium',
  isFlipped = false,
  isSelectable = false,
  isSelected = false,
  showBack = false,
  onSelect,
  onPress,
  style,
}) => {
  const { width } = useWindowDimensions();
  const [isPressed, setIsPressed] = useState(false);
  
  // Calculate card dimensions based on size
  const cardWidth = size === 'small' ? width * 0.25 : size === 'medium' ? width * 0.35 : width * 0.45;
  const cardHeight = cardWidth * 1.4; // Standard card aspect ratio
  
  // Get color based on card type
  const typeColor = cardTypeColors[card.type];
  const rarityColor = rarityColors[card.rarity];
  
  const handlePress = () => {
    if (isSelectable && onSelect) {
      onSelect();
    } else if (onPress) {
      onPress();
    }
  };
  
  const handlePressIn = () => {
    setIsPressed(true);
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
  };
  
  // If showing back, render card back design
  if (showBack) {
    return (
      <View
        style={[
          styles.cardContainer,
          {
            width: cardWidth,
            height: cardHeight,
            backgroundColor: '#333',
            borderColor: '#666',
          },
          style,
        ]}
      >
        <View style={styles.cardBack}>
          <Text style={styles.cardBackText}>Card Game</Text>
        </View>
      </View>
    );
  }
  
  // Render card front
  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          width: cardWidth,
          height: cardHeight,
          transform: [
            { scale: (isPressed || pressed) && isSelectable ? 0.95 : 1 },
            { translateY: (isPressed || pressed) && isSelectable ? 5 : 0 },
          ],
        },
        isSelected && styles.selectedCard,
        style,
      ]}
    >
      {/* Card header */}
      <View style={[styles.cardHeader, { backgroundColor: typeColor }]}>
        <Text style={styles.cardName}>{card.name}</Text>
        <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]}>
          <Text style={styles.rarityText}>{card.rarity.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      
      {/* Card image */}
      <View style={styles.cardImageContainer}>
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImageText}>{card.name.charAt(0)}</Text>
        </View>
        {/* If we have real images:
        <Image
          source={{ uri: card.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        */}
      </View>
      
      {/* Card type */}
      <View style={[styles.cardType, { backgroundColor: typeColor }]}>
        <Text style={styles.cardTypeText}>{card.type.toUpperCase()}</Text>
      </View>
      
      {/* Card stats */}
      <View style={styles.cardStats}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>ATK</Text>
          <Text style={styles.statValue}>{card.stats.attack}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>DEF</Text>
          <Text style={styles.statValue}>{card.stats.defense}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SPD</Text>
          <Text style={styles.statValue}>{card.stats.speed}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SP</Text>
          <Text style={styles.statValue}>{card.stats.special}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>HP</Text>
          <Text style={styles.statValue}>{card.stats.health}</Text>
        </View>
      </View>
      
      {/* Card abilities (only show for medium and large cards) */}
      {size !== 'small' && (
        <View style={styles.cardAbilities}>
          {card.abilities.map((ability, index) => (
            <View key={ability.id} style={styles.abilityRow}>
              <Text style={styles.abilityName}>
                {ability.name} ({ability.energyCost})
              </Text>
              {size === 'large' && (
                <Text style={styles.abilityDescription}>{ability.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}
      
      {/* Energy cost */}
      <View style={styles.energyCost}>
        <Text style={styles.energyCostText}>{card.energyCost}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
  },
  rarityIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardImageContainer: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddd',
  },
  cardImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#888',
  },
  cardType: {
    padding: 4,
    alignItems: 'center',
  },
  cardTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardStats: {
    padding: 6,
    backgroundColor: '#f0f0f0',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
  },
  statValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  cardAbilities: {
    padding: 6,
    backgroundColor: '#e8e8e8',
  },
  abilityRow: {
    marginBottom: 2,
  },
  abilityName: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
  },
  abilityDescription: {
    fontSize: 7,
    color: '#666',
  },
  energyCost: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyCostText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  cardBack: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#555',
    borderRadius: 8,
  },
  cardBackText: {
    color: '#gold',
    fontWeight: 'bold',
    fontSize: 16,
    transform: [{ rotate: '45deg' }],
  },
});
