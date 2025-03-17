import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { ExploreScreen } from './explore/screens/ExploreScreen';
import { BattleScreen } from './battle/screens/BattleScreen';
import { Card } from './battle/models/Card';
import { getStarterDeck, getRandomCards } from './battle/data/cardData';
import { StatusBar } from 'expo-status-bar';

// Game modes
enum GameMode {
  LOADING = 'loading',
  EXPLORATION = 'exploration',
  BATTLE = 'battle',
}

interface MainGameProps {
  onExit?: () => void;
}

// Main game component that manages the game state and transitions
export const MainGame: React.FC<MainGameProps> = ({ onExit }) => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.LOADING);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [cardsWon, setCardsWon] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize game data
  useEffect(() => {
    // Initialize player deck
    const initialDeck = getStarterDeck();
    setPlayerDeck(initialDeck);
    
    // Set initial game mode after assets are loaded
    setTimeout(() => {
      setIsLoading(false);
      setGameMode(GameMode.EXPLORATION);
    }, 1000); // Simulate loading time for demo purposes
  }, []);
  
  // Handle battle start
  const handleStartBattle = () => {
    // Generate a random opponent deck (in a real game, this could be based on the area or enemy)
    // Using the already imported function instead of dynamic import
    const randomCards = getRandomCards(6);
    setOpponentDeck(randomCards);
    
    // Transition to battle mode
    setGameMode(GameMode.BATTLE);
  };
  
  // Handle battle end
  const handleBattleEnd = (won: boolean, newCardsWon: Card[]) => {
    if (won && newCardsWon.length > 0) {
      // Add won cards to player's collection
      setCardsWon((prevCards) => [...prevCards, ...newCardsWon]);
      
      // Add won cards to player's deck if they want
      // For demo, we'll just add them automatically
      setPlayerDeck((prevDeck) => [...prevDeck, ...newCardsWon]);
    }
    
    // Return to exploration mode
    setGameMode(GameMode.EXPLORATION);
  };
  
  // Handle exit from battle (forfeit)
  const handleExitBattle = () => {
    setGameMode(GameMode.EXPLORATION);
  };
  
  // Render game content based on mode
  const renderGameContent = () => {
    switch (gameMode) {
      case GameMode.LOADING:
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading Game...</Text>
          </View>
        );
        
      case GameMode.EXPLORATION:
        return (
          <ExploreScreen
            onStartBattle={handleStartBattle}
            onExit={() => {
              if (onExit) {
                onExit(); // Call the parent's onExit function if provided
              } else {
                console.log('Exit game');
              }
            }}
          />
        );
        
      case GameMode.BATTLE:
        return (
          <BattleScreen
            playerDeck={playerDeck}
            opponentDeck={opponentDeck}
            onBattleEnd={handleBattleEnd}
            onExit={handleExitBattle}
          />
        );
        
      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unknown game mode</Text>
          </View>
        );
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {renderGameContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
  },
});
