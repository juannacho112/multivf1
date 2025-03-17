import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { Player } from '../../models/Card';

interface VictoryScreenProps {
  winner: Player;
  loser: Player;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  winner,
  loser,
  onPlayAgain,
  onExit,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const getPointsBreakdown = (player: Player) => {
    const total = player.points.skill + player.points.stamina + player.points.aura;
    return `${player.points.skill} skill + ${player.points.stamina} stamina + ${player.points.aura} aura = ${total}`;
  };
  
  return (
    <View style={styles.container}>
      <View style={[styles.overlay, { backgroundColor: colors.background + 'E6' }]} />
      <View style={[styles.card, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <ThemedText style={styles.headerText}>
            {winner.id === 'player1' ? 'Victory!' : 'Defeat!'}
          </ThemedText>
        </View>
        
        <View style={styles.content}>
          <View style={styles.resultSummary}>
            <ThemedText type="subtitle" style={[styles.winnerName, { color: colors.primary }]}>
              {winner.name}
            </ThemedText>
            <ThemedText style={styles.winText}>
              {winner.id === 'player1' ? 'You won!' : 'AI won!'}
            </ThemedText>
            
            <View style={[styles.scoreDisplay, { backgroundColor: colors.background }]}>
              <View style={styles.playerScore}>
                <ThemedText style={styles.playerScoreLabel}>
                  {winner.name}
                </ThemedText>
                <ThemedText style={[styles.playerScoreValue, { color: colors.primary }]}>
                  {getPointsBreakdown(winner)}
                </ThemedText>
              </View>
              
              <View style={styles.playerScore}>
                <ThemedText style={styles.playerScoreLabel}>
                  {loser.name}
                </ThemedText>
                <ThemedText style={styles.playerScoreValue}>
                  {getPointsBreakdown(loser)}
                </ThemedText>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.playAgainButton, { backgroundColor: colors.primary }]}
              onPress={onPlayAgain}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <ThemedText style={styles.buttonText}>Play Again</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.exitButton, { borderColor: colors.primary }]}
              onPress={onExit}
            >
              <Ionicons name="exit" size={20} color={colors.primary} />
              <ThemedText style={[styles.buttonText, { color: colors.primary }]}>Exit</ThemedText>
            </TouchableOpacity>
          </View>
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
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '80%',
    maxWidth: 450,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  resultSummary: {
    marginBottom: 20,
  },
  winnerName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  winText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreDisplay: {
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  playerScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerScoreLabel: {
    fontWeight: 'bold',
  },
  playerScoreValue: {
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 130,
    justifyContent: 'center',
  },
  playAgainButton: {
    marginRight: 10,
  },
  exitButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
