import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Card, Rarity } from '../../models/Card';
import { HolographicEffect } from './HolographicEffect';

interface CardDesignProps {
  card: Card | null;
  style?: any;
}

export const CardDesign: React.FC<CardDesignProps> = ({ card, style }) => {
  if (!card) {
    return (
      <View style={[styles.container, styles.emptyCard, style]}>
        <ThemedText style={styles.emptyCardText}>No Card</ThemedText>
      </View>
    );
  }

  // Get the background color based on card rarity
  const backgroundColor = getCardBackgroundColor(card.rarity);

  // Check if card is spectacular to apply holographic effect
  const isSpectacular = card.rarity === 'spectacular';
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor }, 
      style
    ]}>
      {/* Apply holographic effect for spectacular cards */}
      {isSpectacular && <HolographicEffect />}
      {/* Header with card name */}
      <View style={styles.header}>
        <ThemedText style={styles.cardName}>{card.name}</ThemedText>
      </View>

      {/* Main card content area */}
      <View style={styles.cardContent}>
        {/* Total score in white circle on the left */}
        <View style={styles.totalScoreContainer}>
          <View style={styles.totalScoreCircle}>
            <ThemedText style={styles.totalScoreText}>{card.finalTotal}</ThemedText>
          </View>
        </View>

        {/* Image placeholder in the middle */}
        <View style={styles.imageContainer}>
          {card.imageUrl ? (
            <Image
              source={{ uri: typeof card.imageUrl === 'string' ? card.imageUrl : String(card.imageUrl) }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>

        {/* Attribute boxes on the right */}
        <View style={styles.attributesContainer}>
          <View style={styles.attributeBox}>
            <ThemedText style={styles.attributeValue}>{card.aura}</ThemedText>
            <ThemedText style={styles.attributeLabel}>AURA</ThemedText>
          </View>
          <View style={styles.attributeBox}>
            <ThemedText style={styles.attributeValue}>{card.skill}</ThemedText>
            <ThemedText style={styles.attributeLabel}>SKILL</ThemedText>
          </View>
          <View style={styles.attributeBox}>
            <ThemedText style={styles.attributeValue}>{card.stamina}</ThemedText>
            <ThemedText style={styles.attributeLabel}>STAMINA</ThemedText>
          </View>
        </View>
      </View>

      {/* Footer with rarity */}
      <View style={styles.footer}>
        <ThemedText style={styles.rarityText}>{formatRarity(card.rarity)}</ThemedText>
      </View>
    </View>
  );
};

// Helper functions
function getCardBackgroundColor(rarity: Rarity): string {
  switch (rarity) {
    case 'common':
      return '#ffeb3b'; // Yellow
    case 'rare':
      return '#8d6e63'; // Brown
    case 'very_rare':
      return '#ff9800'; // Orange
    case 'epic':
      return '#4caf50'; // Green
    case 'spectacular':
      // For holographic effect, we use a base color
      // The holographic effect would be created with additional styling or animations
      return '#43a047'; // Slightly different shade of green to distinguish
    default:
      return '#e0e0e0'; // Default fallback color
  }
}

function formatRarity(rarity: Rarity): string {
  // Convert snake_case to Title Case (e.g., "very_rare" to "Very Rare")
  return rarity
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  emptyCard: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  totalScoreContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalScoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  totalScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  imageContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '80%',
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
  attributesContainer: {
    width: 60,
    justifyContent: 'space-evenly',
    height: '100%',
  },
  attributeBox: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  attributeValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  attributeLabel: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
