import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { GameScreen } from '../veefriends/GameScreen';
import Card from './Card';
import { useGame } from '../../contexts/GameContext';
import { Card as CardModel } from '../../models/Card';

interface BattleScreenProps {
  onExit: () => void;
  initialAnimation?: boolean;
}

const BattleScreen: React.FC<BattleScreenProps> = ({ onExit, initialAnimation = true }) => {
  const { state, setGameMode, resetGame } = useGame();
  const [showBattleUI, setShowBattleUI] = useState(!initialAnimation);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(initialAnimation ? 0 : 1)).current;
  const scaleAnim = React.useRef(new Animated.Value(initialAnimation ? 0.8 : 1)).current;

  useEffect(() => {
    if (initialAnimation) {
      // Run entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After animation completes, show the battle UI
        setShowBattleUI(true);
      });
    }
  }, []);

  // Function to handle exit animation and game mode transition
  const handleExit = useCallback(() => {
    // First update the game mode in context
    const exitToExploration = () => {
      setGameMode('exploration');
      if (onExit) onExit();
    };
    
    if (initialAnimation) {
      // Run exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(exitToExploration);
    } else {
      // No animation, just exit
      exitToExploration();
    }
  }, [fadeAnim, scaleAnim, initialAnimation, setGameMode, onExit]);
  
  // Handle game over state with a reset option
  const handleReset = useCallback(() => {
    resetGame();
    // Keep in battle mode, but reset the game state
  }, [resetGame]);

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.battleContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Battle header with title and close button */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Card Battle
          </ThemedText>
          <TouchableOpacity style={styles.closeButton} onPress={handleExit}>
            <Ionicons name="close-circle" size={28} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* If showBattleUI is true, show the GameScreen component */}
        {showBattleUI ? (
          <GameScreen 
            onExit={handleExit}
            onReset={handleReset}
          />
        ) : (
          // Otherwise show a loading animation
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Preparing battle...</ThemedText>
            <View style={styles.cardPreview}>
              {/* Placeholder cards with pulsing animation */}
              <Animated.View
                style={[
                  styles.placeholderCard,
                  {
                    transform: [
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.9, 1.05, 0.9],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.placeholderCard,
                  {
                    transform: [
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1.05, 0.9, 1.05],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  battleContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3F51B5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginBottom: 20,
  },
  cardPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  placeholderCard: {
    width: 120,
    height: 160,
    backgroundColor: '#DDD',
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default BattleScreen;
