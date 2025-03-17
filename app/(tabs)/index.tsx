import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

// Component imports
import { GameScreen } from '../../components/veefriends/GameScreen';
import { DeckBuildingScreen } from '../../components/deckbuilding/DeckBuildingScreen';
import { MyDecksScreen } from '../../components/deckbuilding/MyDecksScreen';
import { DeckEditorScreen } from '../../components/deckbuilding/DeckEditorScreen';
import { MainGame } from '../../components/MainGame';
import { generateRandomDeck, fullCardPool } from '../../data/cardData';
import { Card } from '../../models/Card';
import { DeckNavigationProvider } from '../../contexts/NavigationContext';

// Game modes
type GameMode = 'menu' | 'deckBuildingP1' | 'deckBuildingP2' | 'battle' | 'explore' | 'game' | 'myDecks' | 'deckEditor';
type PlayerType = 'human' | 'ai';

export default function HomeScreen() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [playerOneName, setPlayerOneName] = useState<string>('Player 1');
  const [playerTwoName, setPlayerTwoName] = useState<string>('Player 2');
  const [playerOneType, setPlayerOneType] = useState<PlayerType>('human');
  const [playerTwoType, setPlayerTwoType] = useState<PlayerType>('ai');
  const [playerOneDeck, setPlayerOneDeck] = useState<Card[]>([]);
  const [playerTwoDeck, setPlayerTwoDeck] = useState<Card[]>([]);
  // State for navigation parameters
  const [navigation, setNavigation] = useState<{ 
    params?: { deckId?: string } 
  }>({});
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Handle deck confirmation for Player 1
  const handlePlayerOneDeckConfirm = (deck: Card[]) => {
    setPlayerOneDeck(deck);
    
    // If Player 2 is AI, generate their deck and go to battle
    if (playerTwoType === 'ai') {
      const aiDeck = generateRandomDeck(fullCardPool);
      setPlayerTwoDeck(aiDeck);
      setGameMode('battle');
    } else {
      // If Player 2 is human, go to their deck building screen
      setGameMode('deckBuildingP2');
    }
  };

  // Handle deck confirmation for Player 2
  const handlePlayerTwoDeckConfirm = (deck: Card[]) => {
    setPlayerTwoDeck(deck);
    setGameMode('battle');
  };
  
  // Handle exit from battle mode
  const handleBattleExit = () => {
    // Reset and go back to menu
    setGameMode('menu');
  };

  // Handle start single player game
  const handleSinglePlayer = () => {
    setPlayerOneType('human');
    setPlayerTwoType('ai');
    setPlayerOneName('Player');
    setPlayerTwoName('AI Opponent');
    setGameMode('deckBuildingP1');
  };

  // Handle multiplayer game
  const handleMultiplayer = () => {
    setPlayerOneType('human');
    setPlayerTwoType('human');
    setPlayerOneName('Player 1');
    setPlayerTwoName('Player 2');
    setGameMode('deckBuildingP1');
  };

  // Handle exploration mode
  const handleExplore = () => {
    setGameMode('explore');
  };

  // Navigation methods for deck management
  const navigateToDeckEditor = (deckId: string) => {
    setNavigation({ params: { deckId } });
    setGameMode('deckEditor');
  };

const goBack = () => {
  setNavigation({});
  setGameMode('menu'); // Navigate back to the main menu instead
};

  // Navigation context value
  const navigationContextValue = {
    navigateToDeckEditor,
    goBack
  };
  
  // For DeckBuilding navigation
  const goBackToMenu = () => {
    setGameMode('menu');
  };
  
  const goBackToPlayerOne = () => {
    setGameMode('deckBuildingP1');
  };

  // Render content based on game mode
  const renderContent = () => {
    switch (gameMode) {
      case 'deckBuildingP1':
        return (
          <DeckNavigationProvider value={{ 
            navigateToDeckEditor, 
            goBack: goBackToMenu 
          }}>
            <DeckBuildingScreen
              onDeckConfirm={handlePlayerOneDeckConfirm}
              playerName={playerOneName}
            />
          </DeckNavigationProvider>
        );
      case 'deckBuildingP2':
        return (
          <DeckNavigationProvider value={{ 
            navigateToDeckEditor, 
            goBack: goBackToPlayerOne 
          }}>
            <DeckBuildingScreen
              onDeckConfirm={handlePlayerTwoDeckConfirm}
              playerName={playerTwoName}
            />
          </DeckNavigationProvider>
        );
      case 'battle':
        return (
          <GameScreen 
            onExit={handleBattleExit}
          />
        );
      case 'explore':
        return <MainGame onExit={handleBattleExit} />;
      case 'myDecks':
        return (
          <DeckNavigationProvider value={navigationContextValue}>
            <MyDecksScreen />
          </DeckNavigationProvider>
        );
      case 'deckEditor':
        if (!navigation.params?.deckId) {
          setGameMode('myDecks');
          return null;
        }
        return (
          <DeckNavigationProvider value={navigationContextValue}>
            <DeckEditorScreen 
              route={{ params: { deckId: navigation.params.deckId } }} 
            />
          </DeckNavigationProvider>
        );
      case 'menu':
      default:
        return renderMainMenu();
    }
  };

  // Render the main menu
  const renderMainMenu = () => {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/react-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="subtitle" style={styles.title}>
            Card Battle Explorer
          </ThemedText>
        </View>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={[styles.menuButton, styles.exploreButton]} 
            onPress={handleExplore}
          >
            <Ionicons name="map-outline" size={24} color={isDark ? "#FFF" : "#333"} />
            <ThemedText style={styles.buttonText}>Explore Mode</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, styles.singlePlayerButton]} 
            onPress={handleSinglePlayer}
          >
            <Ionicons name="person-outline" size={24} color={isDark ? "#FFF" : "#333"} />
            <ThemedText style={styles.buttonText}>Single Player Battle</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, styles.multiplayerButton]} 
            onPress={handleMultiplayer}
          >
            <Ionicons name="people-outline" size={24} color={isDark ? "#FFF" : "#333"} />
            <ThemedText style={styles.buttonText}>Local Multiplayer</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, styles.myDecksButton]} 
            onPress={() => setGameMode('myDecks')}
          >
            <Ionicons name="albums-outline" size={24} color={isDark ? "#FFF" : "#333"} />
            <ThemedText style={styles.buttonText}>My Decks</ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>v1.0.0 • React Native + Expo</ThemedText>
        </View>
      </ThemedView>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {renderContent()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    maxWidth: 300,
    alignSelf: 'center',
    width: '100%',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  exploreButton: {
    backgroundColor: '#FF9800',
  },
  singlePlayerButton: {
    backgroundColor: '#4CAF50',
  },
  multiplayerButton: {
    backgroundColor: '#2196F3',
  },
  myDecksButton: {
    backgroundColor: '#9C27B0', // Purple for the My Decks button
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.7,
  },
});
