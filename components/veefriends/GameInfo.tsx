import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ChallengeAttribute } from '../../models/Card';
import { createGameScreenStyles } from './GameScreenStyles';

interface GameInfoProps {
  phase: string;
  currentChallenger: 'player1' | 'player2';
  challengeAttribute: ChallengeAttribute | null;
  colors: any;
}

export const GameInfo: React.FC<GameInfoProps> = ({
  phase,
  currentChallenger,
  challengeAttribute,
  colors,
}) => {
  const styles = createGameScreenStyles(colors);
  
  // Get phase text based on current game phase and challenger
  const getPhaseText = (): string => {
    switch (phase) {
      case 'draw':
        return 'Drawing cards...';
      case 'challengerPick':
        return `${currentChallenger === 'player1' ? 'Your' : 'AI'} turn to choose attribute`;
      case 'acceptDeny':
        return `${currentChallenger === 'player1' ? 'AI' : 'Your'} turn to accept/deny`;
      case 'resolve':
        return 'Resolving challenge...';
      case 'gameOver':
        return 'Game Over!';
      default:
        return 'Waiting...';
    }
  };
  
  return (
    <View style={styles.gameInfo}>
      <View style={[
        styles.phaseIndicator,
        { backgroundColor: colors.lightGray }
      ]}>
        <ThemedText type="subtitle" style={styles.phaseText}>
          {getPhaseText()}
        </ThemedText>
      </View>
      
      {challengeAttribute && (
        <View style={[
          styles.challengeBadge,
          { backgroundColor: colors.primary }
        ]}>
          <ThemedText style={styles.challengeText}>
            Challenge: {challengeAttribute.toUpperCase()}
          </ThemedText>
        </View>
      )}
    </View>
  );
};
