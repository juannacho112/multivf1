import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import AuthScreen from '../screens/AuthScreen';
import MultiplayerLobbyScreen from '../screens/MultiplayerLobbyScreen';
import GameWaitingRoom from '../screens/GameWaitingRoom';
import OnlineBattleScreen from '../screens/OnlineBattleScreen';

interface MultiplayerNavigatorProps {
  onExit: () => void;
  initialScreen?: string;
}

/**
 * This component handles navigation flow between different multiplayer screens
 * based on the current state of the game and authentication.
 */
const MultiplayerNavigator: React.FC<MultiplayerNavigatorProps> = ({ onExit, initialScreen = 'Auth' }) => {
  const { isAuthenticated, isConnected, activeGame } = useMultiplayer();
  const [currentScreen, setCurrentScreen] = useState<string>(initialScreen);
  const [forceNavigateTo, setForceNavigateTo] = useState<string | null>(null);
  const [isPendingNavigation, setIsPendingNavigation] = useState(false);

  // Determine what screen to show based on current state
  useEffect(() => {
    // If we have a forced navigation target, prioritize it
    if (forceNavigateTo) {
      console.log(`Navigator: Forced navigation to ${forceNavigateTo}`);
      setCurrentScreen(forceNavigateTo);
      setForceNavigateTo(null);
      return;
    }

    const newState = {
      isAuthenticated,
      isConnected,
      activeGame,
      currentScreen
    };
    console.log('Navigator state update:', newState);

    // First check for existing game
    if (activeGame) {
      if (activeGame.status === 'waiting') {
        setCurrentScreen('Waiting');
      } else if (['active', 'completed'].includes(activeGame.status)) {
        setCurrentScreen('Game');
      }
      return;
    }

    // If no game, check auth state
    if (isAuthenticated && isConnected) {
      // Only navigate to lobby if we're currently on Auth screen
      // This prevents unnecessary redirects once we're in deeper screens
      if (currentScreen === 'Auth') {
        setCurrentScreen('Lobby');
      }
    } else {
      // Only return to auth if we're not already in a game
      if (!activeGame && currentScreen !== 'Auth') {
        setCurrentScreen('Auth');
      }
    }
  }, [isAuthenticated, isConnected, activeGame, currentScreen, forceNavigateTo]);

  // Handle forced navigation after authentication success
  const handleAuthSuccess = () => {
    console.log('Navigator: Forced navigation to Lobby after auth success');
    setIsPendingNavigation(true);
    
    // Force navigation to lobby with a slight delay to allow state to update
    setTimeout(() => {
      setForceNavigateTo('Lobby');
      setIsPendingNavigation(false);
    }, 500);
  };

  // Handle navigation from lobby to game
  const handleGameCreated = (gameId: string) => {
    console.log(`Navigator: Game created with ID: ${gameId}`);
    // Force navigation will be triggered by activeGame state change
  };

  // Handle back button from lobby
  const handleBackFromMultiplayer = () => {
    console.log('Navigator: Back from multiplayer');
    onExit();
  };

  // Render appropriate screen
  const renderScreen = () => {
    if (isPendingNavigation) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'Auth':
        return <AuthScreen onAuthSuccess={handleAuthSuccess} onBack={onExit} />;
      
      case 'Lobby':
        return (
          <MultiplayerLobbyScreen 
            onBack={handleBackFromMultiplayer}
            onGameCreated={handleGameCreated}
          />
        );
      
      case 'Waiting':
        return (
          <GameWaitingRoom 
            onBack={() => setCurrentScreen('Lobby')}
          />
        );
      
      case 'Game':
        return (
          <OnlineBattleScreen 
            onBack={() => setCurrentScreen('Lobby')}
          />
        );
      
      default:
        return (
          <View style={styles.container}>
            <Text>Something went wrong!</Text>
            <Button title="Go Back" onPress={onExit} />
          </View>
        );
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  }
});

export default MultiplayerNavigator;
