import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { Card } from '../../models/Card';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { CardDesign } from './CardDesign';

interface FlippableCardProps {
  card: Card | null;
  faceDown?: boolean;
  manualFlip?: boolean;
  flipToFront?: boolean;
  useEnhancedDesign?: boolean;
}

export const EnhancedFlippableCard: React.FC<FlippableCardProps> = ({ 
  card, 
  faceDown = false,
  manualFlip = false,
  flipToFront = false,
  useEnhancedDesign = true
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [isFlipped, setIsFlipped] = useState(faceDown);
  const animatedValue = useRef(new Animated.Value(faceDown ? 0 : 1)).current;
  
  useEffect(() => {
    setIsFlipped(faceDown);
    
    // Only animate after the component is mounted
    Animated.timing(animatedValue, {
      toValue: faceDown ? 0 : 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [faceDown]);
  
  // Handle prop-driven flips
  useEffect(() => {
    if (flipToFront && isFlipped) {
      handleFlip();
    }
  }, [flipToFront]);
  
  const handleFlip = () => {
    if (!manualFlip) return;
    
    setIsFlipped(!isFlipped);
    Animated.timing(animatedValue, {
      toValue: isFlipped ? 1 : 0,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };
  
  const frontInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg']
  });
  
  const backInterpolation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });
  
  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolation }]
  };
  
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolation }]
  };
  
  const cardFrontOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1]
  });

  const cardBackOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0]
  });

  const renderCardFront = () => {
    // Enhanced debug logging to help identify issues with card data
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EnhancedFlippableCard] Rendering card:`, card ? 
        `${card.name || 'unnamed'} (${card.id || 'no-id'})` : 'null/undefined');
    }
    
    // Handle null or undefined card
    if (!card) {
      // Show empty card design for missing cards with loading indicator
      return (
        <View style={[styles.cardSide, styles.cardFront, { backgroundColor: colors.background, borderColor: colors.tint }]}>
          <ThemedText type="subtitle" style={styles.emptyCardText}>Loading Card...</ThemedText>
          <View style={additionalStyles.loadingIndicator}>
            <Ionicons name="sync" size={24} color={colors.tint} />
          </View>
        </View>
      );
    }

    // More comprehensive validation to handle malformed card data
    const isValidCard = card && 
      typeof card === 'object' && 
      'name' in card && 
      typeof card.name === 'string' &&
      'skill' in card && 
      !isNaN(Number(card.skill)) &&
      'stamina' in card && 
      !isNaN(Number(card.stamina)) &&
      'aura' in card && 
      !isNaN(Number(card.aura));

    // Create a safe card object with fallback values for invalid data
    const safeCard = {
      id: card?.id || `emergency-${Date.now()}`,
      name: typeof card?.name === 'string' ? card.name : 'Unknown Card',
      skill: !isNaN(Number(card?.skill)) ? Number(card.skill) : 10,
      stamina: !isNaN(Number(card?.stamina)) ? Number(card.stamina) : 10,
      aura: !isNaN(Number(card?.aura)) ? Number(card.aura) : 10,
      baseTotal: !isNaN(Number(card?.baseTotal)) ? Number(card.baseTotal) : 30,
      finalTotal: !isNaN(Number(card?.finalTotal)) ? Number(card.finalTotal) : 30,
      rarity: typeof card?.rarity === 'string' ? card.rarity : 'common',
      character: typeof card?.character === 'string' ? card.character : 'Unknown',
      type: typeof card?.type === 'string' ? card.type : 'standard',
      specialAbility: card?.specialAbility || null,
      imageUrl: card?.imageUrl || null
    };

    // If card is invalid but we can recover with fallbacks
    if (!isValidCard) {
      console.warn('[EnhancedFlippableCard] Recovered from invalid card data:', card);
      
      // Show warning indicator on recovered cards
      return (
        <View style={styles.cardContainer}>
          <View style={[styles.cardSide, styles.cardFront, { backgroundColor: colors.background, borderColor: '#FFA500' }]}>
            {useEnhancedDesign ? (
              <CardDesign card={safeCard} />
            ) : (
              renderBasicCardContent(safeCard)
            )}
            <View style={additionalStyles.warningBadge}>
              <Ionicons name="warning" size={16} color="#FFA500" />
            </View>
          </View>
        </View>
      );
    }
    
    if (useEnhancedDesign) {
      return (
        <Animated.View style={[styles.cardSide, { opacity: cardFrontOpacity }]}>
          <CardDesign card={card} />
        </Animated.View>
      );
    }
    
    return renderBasicCardContent(card);
  };
  
  // Add styles for loading indicator and warning badge
  const additionalStyles = StyleSheet.create({
    loadingIndicator: {
      alignItems: 'center',
      marginTop: 10,
    },
    warningBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(255, 165, 0, 0.2)',
      borderRadius: 12,
      padding: 4,
    }
  });

  // Helper function to render the basic card content
  const renderBasicCardContent = (card: any) => {
    return (
      <Animated.View style={[styles.cardSide, styles.cardFront, { backgroundColor: colors.background, borderColor: colors.tint, opacity: cardFrontOpacity }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.cardName}>{card.name}</ThemedText>
          <View style={[styles.cardRarity, { backgroundColor: getRarityColor(card.rarity) }]}>
            <ThemedText style={styles.rarityText}>{card.rarity}</ThemedText>
          </View>
        </View>

        {card.imageUrl && (
          <View style={styles.cardImage} />
        )}

        <View style={styles.cardBody}>
          <View style={styles.attributeRow}>
            <View style={styles.attributeItem}>
              <Ionicons name="flash" size={16} color={colors.text} />
              <ThemedText style={styles.attributeName}>Skill</ThemedText>
              <ThemedText style={styles.attributeValue}>{card.skill}</ThemedText>
            </View>
            
            <View style={styles.attributeItem}>
              <Ionicons name="fitness" size={16} color={colors.text} />
              <ThemedText style={styles.attributeName}>Stamina</ThemedText>
              <ThemedText style={styles.attributeValue}>{card.stamina}</ThemedText>
            </View>
            
            <View style={styles.attributeItem}>
              <Ionicons name="sparkles" size={16} color={colors.text} />
              <ThemedText style={styles.attributeName}>Aura</ThemedText>
              <ThemedText style={styles.attributeValue}>{card.aura}</ThemedText>
            </View>
          </View>
          
          {card.specialAbility && (
            <View style={styles.specialAbility}>
              <ThemedText style={styles.specialAbilityTitle}>Special Ability:</ThemedText>
              <ThemedText style={styles.specialAbilityText}>{card.specialAbility}</ThemedText>
            </View>
          )}
          
          <View style={[styles.totalRow, { borderTopColor: colors.tint }]}>
            <ThemedText style={styles.totalLabel}>Final Total:</ThemedText>
            <ThemedText style={styles.totalValue}>{card.finalTotal}</ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderCardBack = () => {
    return (
      <Animated.View style={[styles.cardSide, styles.cardBack, { backgroundColor: colors.primary, opacity: cardBackOpacity }]}>
        <View style={styles.cardBackContent}>
          <Ionicons name="shield" size={50} color="#FFFFFF" />
          <ThemedText style={styles.cardBackText}>Battle Card</ThemedText>
        </View>
      </Animated.View>
    );
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '#8BC34A';
      case 'uncommon':
        return '#03A9F4';
      case 'rare':
        return '#9C27B0';
      case 'epic':
        return '#FF9800';
      case 'legendary':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const cardClickHandler = manualFlip ? handleFlip : undefined;

  return (
    <TouchableOpacity 
      style={[styles.cardContainer, { perspective: 1000 } as any]}
      onPress={cardClickHandler}
      activeOpacity={manualFlip ? 0.7 : 1}
      disabled={!manualFlip}
    >
      <View style={[styles.cardWrapper, { transformStyle: 'preserve-3d' } as any]}>
        <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
          {renderCardFront()}
        </Animated.View>
        <Animated.View style={[styles.cardFace, styles.cardFaceBack, backAnimatedStyle]}>
          {renderCardBack()}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// Basic styles for holographic effects
const holographicStyles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  holographicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    backgroundColor: 'transparent',
  },
});

const styles = StyleSheet.create({
  cardContainer: {
    width: 220,
    height: 300,
    marginHorizontal: 20, // Adding space on both sides to prevent edge clipping
    // perspective is added inline with TypeScript casting
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    // transformStyle is added inline with TypeScript casting
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardFaceBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardSide: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardFront: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
  },
  cardBack: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCardText: {
    textAlign: 'center',
    marginTop: '45%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontWeight: 'bold',
    fontSize: 14,
    flex: 1,
  },
  cardRarity: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardImage: {
    height: 100,
    width: '100%',
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  attributeRow: {
    marginVertical: 8,
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  attributeName: {
    marginLeft: 8,
    flex: 1,
  },
  attributeValue: {
    fontWeight: 'bold',
  },
  specialAbility: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  specialAbilityTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 12,
  },
  specialAbilityText: {
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 8,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
  }
});
