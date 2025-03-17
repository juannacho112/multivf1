import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../ui/BackButton';
import { createGameScreenStyles } from './GameScreenStyles';

interface GameHeaderProps {
  roundNumber: number;
  potSize: number;
  burnPileLength: number;
  onExit: () => void;
  colors: any;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roundNumber,
  potSize,
  burnPileLength,
  onExit,
  colors,
}) => {
  const styles = createGameScreenStyles(colors);
  
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <BackButton 
          onPress={onExit} 
          requireConfirmation={true}
          color={colors.primary}
        />
        <View style={styles.roundInfo}>
          <View style={[styles.roundBadge, {backgroundColor: colors.primary}]}>
            <ThemedText style={styles.roundText}>
              Round {roundNumber}/20
            </ThemedText>
          </View>
          
          {potSize > 1 && (
            <View style={styles.potBadge}>
              <Ionicons name="layers" size={16} color="white" />
              <ThemedText style={styles.potText}>
                Pot: {potSize}
              </ThemedText>
            </View>
          )}
          
          <View style={styles.burnPileBadge}>
            <Ionicons name="flame" size={16} color="white" />
            <ThemedText style={styles.burnPileText}>
              {burnPileLength}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
};
