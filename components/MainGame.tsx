import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BattleScreen } from './battle/screens/BattleScreen';
import { Card } from './battle/models/Card';
import { getStarterDeck, getRandomCards } from './battle/data/cardData';
import { StatusBar } from 'expo-status-bar';
import { MultiplayerProvider } from './multiplayer/contexts/MultiplayerContext';
import MultiplayerNavigator from './multiplayer/navigation/MultiplayerNavigator';

// Game modes
enum GameMode {
  LOADING = 'loading',
  MAIN_MENU = 'main_menu',
  SINGLEPLAYER = 'singleplayer',
  MULTIPLAYER = 'multiplayer', // Unified multiplayer mode that handles auth, lobby, etc. using navigator
}

interface MainGameProps {
  onExit?: () => void;
}

// Main game component that manages the game state and transitions
export const MainGame: React.FC<MainGameProps & { initialMode?: string }> = ({ 
  onExit, 
  initialMode 
}) => {
  console.log('MainGame mounted with initialMode:', initialMode);
  
  // If initialMode is provided, use it (for direct navigation to multiplayer)
  const initialGameMode = initialMode === 'multiplayer' 
    ? GameMode.MULTIPLAYER 
    : GameMode.LOADING;
  
  console.log('Setting initial game mode to:', initialGameMode);
    
  const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [opponentDeck, setOpponentDeck] = useState<Card[]>([]);
  const [cardsWon, setCardsWon] = useState<Card[]>([]);
  
  // Initialize game data
  useEffect(() => {
    // Initialize player deck for single player mode
    const initialDeck = getStarterDeck();
    setPlayerDeck(initialDeck);
    
    // Generate a random opponent deck for single player mode
    const randomCards = getRandomCards(6);
    setOpponentDeck(randomCards);
    
    // Set initial game mode after assets are loaded
    setTimeout(() => {
      setGameMode(GameMode.MAIN_MENU);
    }, 500); // Reduced loading time
  }, []);

  // Log game mode changes
  useEffect(() => {
    console.log(`Game mode changed to: ${gameMode}`);
  }, [gameMode]);
  
  // Handle single player battle end
  const handleBattleEnd = (won: boolean, newCardsWon: Card[]) => {
    if (won && newCardsWon.length > 0) {
      // Add won cards to player's collection
      setCardsWon((prevCards) => [...prevCards, ...newCardsWon]);
      
      // Add won cards to player's deck if they want
      // For demo, we'll just add them automatically
      setPlayerDeck((prevDeck) => [...prevDeck, ...newCardsWon]);
    }
    
    // Return to game mode selection
    setGameMode(GameMode.MAIN_MENU);
  };
  
  // Handle going back to the main menu
  const handleBackToMainMenu = () => {
    setGameMode(GameMode.MAIN_MENU);
  };
  
  // Render game content based on mode
  const renderGameContent = () => {
    if (gameMode === GameMode.LOADING) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading Game...</Text>
        </View>
      );
    }
    
    if (gameMode === GameMode.MAIN_MENU) {
      return (
        <View style={styles.modeSelectContainer}>
          <Text style={styles.titleText}>VeeFriends Card Game</Text>
          
          <TouchableOpacity 
            style={[styles.modeButton, styles.singlePlayerButton]}
            onPress={() => setGameMode(GameMode.SINGLEPLAYER)}
          >
            <Text style={styles.modeButtonText}>Single Player</Text>
            <Text style={styles.modeButtonSubtext}>Play against AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, styles.multiPlayerButton]}
            onPress={() => setGameMode(GameMode.MULTIPLAYER)}
          >
            <Text style={styles.modeButtonText}>Battle Online</Text>
            <Text style={styles.modeButtonSubtext}>Play against other players</Text>
          </TouchableOpacity>
          
          {onExit && (
            <TouchableOpacity style={styles.backButton} onPress={onExit}>
              <Text style={styles.backButtonText}>Exit Game</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    if (gameMode === GameMode.SINGLEPLAYER) {
      return (
        <BattleScreen
          playerDeck={playerDeck}
          opponentDeck={opponentDeck}
          onBattleEnd={handleBattleEnd}
          onExit={handleBackToMainMenu}
        />
      );
    }
    
    if (gameMode === GameMode.MULTIPLAYER) {
      // Use our first navigator screen as Auth by default when entering multiplayer
      return (
        <MultiplayerNavigator 
          initialScreen="Auth"
          onExit={handleBackToMainMenu}
        />
      );
    }
    
    return null;
  };
  
  // For multiplayer mode, wrap the content in the MultiplayerProvider
  const renderWithProvider = (content: React.ReactNode) => {
    if (gameMode === GameMode.MULTIPLAYER) {
      return (
        <MultiplayerProvider>
          {content}
        </MultiplayerProvider>
      );
    }
    
    return content;
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {renderWithProvider(renderGameContent())}
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
  modeSelectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  modeButton: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  singlePlayerButton: {
    backgroundColor: '#4CAF50',
  },
  multiPlayerButton: {
    backgroundColor: '#2196F3',
  },
  modeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modeButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#757575',
    fontSize: 16,
  },
});
