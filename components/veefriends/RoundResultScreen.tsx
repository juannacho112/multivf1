import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Card, ChallengeAttribute } from '../../models/Card';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { CardDesign } from './CardDesign';

interface RoundResultScreenProps {
  playerCard: Card | null;
  opponentCard: Card | null;
  playerName: string;
  opponentName: string;
  winner: 'player1' | 'player2' | null;
  challengeAttribute: ChallengeAttribute | null;
  pointsAwarded: number;
  onContinue: () => void;
}

export const RoundResultScreen: React.FC<RoundResultScreenProps> = ({
  playerCard,
  opponentCard,
  playerName,
  opponentName,
  winner,
  challengeAttribute,
  pointsAwarded,
  onContinue,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  // Get attribute values from cards
  const getAttributeValue = (card: Card | null, attribute: ChallengeAttribute | null) => {
    if (!card || !attribute) return '?';
    
    if (attribute === 'total') {
      return card.finalTotal;
    } else {
      return card[attribute];
    }
  };
  
  // Get icon name for attribute
  const getAttributeIcon = (attribute: ChallengeAttribute | null) => {
    if (!attribute) return 'help-circle';
    
    switch (attribute) {
      case 'skill':
        return 'flash';
      case 'stamina':
        return 'fitness';
      case 'aura':
        return 'sparkles';
      case 'total':
        return 'calculator';
      default:
        return 'help-circle';
    }
  };
  
  // Format attribute name for display
  const formatAttributeName = (attribute: ChallengeAttribute | null) => {
    if (!attribute) return 'Unknown';
    return attribute.charAt(0).toUpperCase() + attribute.slice(1);
  };
  
  // Get result text based on winner
  const getResultText = () => {
    if (winner === 'player1') {
      return 'You won this round!';
    } else if (winner === 'player2') {
      return 'AI won this round!';
    } else {
      return 'This round is a tie!';
    }
  };
  
  // Get color based on winner
  const getResultColor = () => {
    if (winner === 'player1') {
      return colors.success || '#4CAF50';
    } else if (winner === 'player2') {
      return colors.error || '#F44336';
    } else {
      return colors.warning || '#FF9800';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.overlay, { backgroundColor: colors.background + 'E6' }]} />
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: getResultColor() }]}>
          <ThemedText style={styles.headerText}>Round Result</ThemedText>
        </View>
        
        <View style={styles.content}>
          <ThemedText type="subtitle" style={[styles.resultText, { color: getResultColor() }]}>
            {getResultText()}
          </ThemedText>
          
          <View style={styles.attributeRow}>
            <Ionicons 
              name={getAttributeIcon(challengeAttribute) as any} 
              size={24} 
              color={colors.primary} 
            />
            <ThemedText style={[styles.attributeName, { color: colors.primary }]}>
              {formatAttributeName(challengeAttribute)} Challenge
            </ThemedText>
          </View>
          
          {/* Card comparison */}
          <View style={styles.cardsContainer}>
            <View style={styles.cardWrapper}>
              <CardDesign card={playerCard} style={styles.resultCard} />
              <ThemedText style={styles.playerName}>{playerName}</ThemedText>
              <ThemedText 
                style={[
                  styles.attributeValue, 
                  winner === 'player1' && { fontWeight: 'bold', color: colors.success || '#4CAF50' }
                ]}
              >
                {getAttributeValue(playerCard, challengeAttribute)}
              </ThemedText>
            </View>
            
            {winner !== null && (
              <View style={[
                styles.resultColumn,
                { backgroundColor: getResultColor() }
              ]}>
                <Ionicons 
                  name={winner === 'player1' ? 'arrow-back' : 'arrow-forward'} 
                  size={20} 
                  color="white" 
                />
              </View>
            )}
            
            <View style={styles.cardWrapper}>
              <CardDesign card={opponentCard} style={styles.resultCard} />
              <ThemedText style={styles.playerName}>{opponentName}</ThemedText>
              <ThemedText 
                style={[
                  styles.attributeValue, 
                  winner === 'player2' && { fontWeight: 'bold', color: colors.error || '#F44336' }
                ]}
              >
                {getAttributeValue(opponentCard, challengeAttribute)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.pointsAwardedContainer}>
            <ThemedText style={styles.pointsAwardedText}>
              Points Awarded: {pointsAwarded}
            </ThemedText>
          </View>
          
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={onContinue}
          >
            <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  resultCard: {
    width: 130,
    height: 180,
    marginBottom: 8,
    transform: [{ scale: 0.8 }],
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  resultText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 20,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  attributeName: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '500',
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  playerColumn: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultColumn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  playerName: {
    marginBottom: 8,
    fontWeight: '500',
  },
  attributeValue: {
    fontSize: 24,
  },
  pointsAwardedContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsAwardedText: {
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
});
