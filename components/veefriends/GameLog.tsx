import React from 'react';
import { View, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ChallengeAttribute } from '../../models/Card';
import { createGameScreenStyles } from './GameScreenStyles';

interface GameLogProps {
  roundNumber: number;
  challengeAttribute: ChallengeAttribute | null;
  currentChallenger: 'player1' | 'player2';
  potSize: number;
  burnPileLength: number;
  deniedAttributes: ChallengeAttribute[];
  colors: any;
}

export const GameLog: React.FC<GameLogProps> = ({
  roundNumber,
  challengeAttribute,
  currentChallenger,
  potSize,
  burnPileLength,
  deniedAttributes,
  colors,
}) => {
  const styles = createGameScreenStyles(colors);
  
  return (
    <View style={[
      styles.logContainer,
      {backgroundColor: colors.background, borderColor: colors.mediumGray}
    ]}>
      <View style={styles.logHeader}>
        <ThemedText type="subtitle" style={styles.logTitle}>Game Log</ThemedText>
        <View style={[styles.logBadge, {backgroundColor: colors.primary}]}>
          <ThemedText style={styles.logBadgeText}>LIVE</ThemedText>
        </View>
      </View>
      
      <ScrollView 
        style={styles.logScroll}
        contentContainerStyle={styles.logContent}
      >
        <ThemedText>Round {roundNumber} started.</ThemedText>
        
        {challengeAttribute && (
          <ThemedText style={styles.logEntry}>
            {currentChallenger === 'player1' ? 'You' : 'AI'} challenged with{' '}
            <ThemedText style={{fontWeight: 'bold', color: colors.primary}}>
              {challengeAttribute.toUpperCase()}
            </ThemedText>
          </ThemedText>
        )}
        
        {potSize > 1 && (
          <ThemedText style={styles.logEntry}>
            Current pot size: {potSize}
          </ThemedText>
        )}
        
        {burnPileLength > 0 && (
          <ThemedText style={styles.logEntry}>
            Cards in burn pile: {burnPileLength}
          </ThemedText>
        )}
        
        {deniedAttributes.length > 0 && (
          <ThemedText style={styles.logEntry}>
            Denied attributes: {deniedAttributes.join(', ')}
          </ThemedText>
        )}
      </ScrollView>
    </View>
  );
};
