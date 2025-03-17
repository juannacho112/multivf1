import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { createGameScreenStyles } from './GameScreenStyles';

// Define the Player type based on what's used in the original component
interface PlayerPoints {
  skill: number;
  stamina: number;
  aura: number;
}

interface Player {
  name: string;
  points: PlayerPoints;
  deck: any[];
  terrificTokenUsed: boolean;
}

interface PlayerScoreboardProps {
  player: Player;
  playerId: 'player1' | 'player2';
  currentChallenger: 'player1' | 'player2';
  isSmallScreen: boolean;
  colors: any;
}

export const PlayerScoreboard: React.FC<PlayerScoreboardProps> = ({
  player,
  playerId,
  currentChallenger,
  isSmallScreen,
  colors,
}) => {
  const styles = createGameScreenStyles(colors);
  const isCurrentPlayer = playerId === 'player1';
  const isChallenger = playerId === currentChallenger;

  return (
    <View style={[
      styles.scoreboardContainer, 
      !isCurrentPlayer && styles.aiScoreboardContainer,
      isSmallScreen && styles.compactScoreboard
    ]}>
      <View style={styles.playerInfoRow}>
        <ThemedText 
          type="subtitle" 
          style={[
            styles.playerName,
            isChallenger && { color: colors.primary }
          ]}
        >
          {player.name}
        </ThemedText>
        
        {isChallenger && (
          <View style={[styles.challengerBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={12} color="white" />
            <ThemedText style={styles.challengerText}>
              {isSmallScreen ? '' : 'Challenger'}
            </ThemedText>
          </View>
        )}
        
        {!player.terrificTokenUsed && (
          <View style={styles.tokenBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
          </View>
        )}
      </View>
      
      <View style={styles.pointsRow}>
        <View 
          style={[
            styles.pointBadge, 
            player.points.skill >= 7 && [styles.winningPoint, {backgroundColor: colors.primary}]
          ]}
        >
          <Ionicons 
            name="flash" 
            size={isSmallScreen ? 14 : 16} 
            color={player.points.skill >= 7 ? '#FFFFFF' : colors.text} 
          />
          <ThemedText 
            style={[
              styles.pointValue, 
              player.points.skill >= 7 && styles.winningPointText
            ]}
          >
            {player.points.skill}
          </ThemedText>
        </View>
        
        <View 
          style={[
            styles.pointBadge, 
            player.points.stamina >= 7 && [styles.winningPoint, {backgroundColor: colors.primary}]
          ]}
        >
          <Ionicons 
            name="fitness" 
            size={isSmallScreen ? 14 : 16} 
            color={player.points.stamina >= 7 ? '#FFFFFF' : colors.text} 
          />
          <ThemedText 
            style={[
              styles.pointValue, 
              player.points.stamina >= 7 && styles.winningPointText
            ]}
          >
            {player.points.stamina}
          </ThemedText>
        </View>
        
        <View 
          style={[
            styles.pointBadge, 
            player.points.aura >= 7 && [styles.winningPoint, {backgroundColor: colors.primary}]
          ]}
        >
          <Ionicons 
            name="sparkles" 
            size={isSmallScreen ? 14 : 16} 
            color={player.points.aura >= 7 ? '#FFFFFF' : colors.text} 
          />
          <ThemedText 
            style={[
              styles.pointValue, 
              player.points.aura >= 7 && styles.winningPointText
            ]}
          >
            {player.points.aura}
          </ThemedText>
        </View>
      </View>
      
      <ThemedText type="default" style={styles.deckCount}>
        Deck: {player.deck.length} cards
      </ThemedText>
    </View>
  );
};
