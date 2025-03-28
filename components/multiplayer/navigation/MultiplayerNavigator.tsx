import React, { useEffect, useState } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import AuthScreen from '../screens/AuthScreen';
import MultiplayerLobbyScreen from '../screens/MultiplayerLobbyScreen';
import GameWaitingRoom from '../screens/GameWaitingRoom';
import OnlineBattleScreen from '../screens/OnlineBattleScreen';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';

type Screen = 'Auth' | 'Lobby' | 'WaitingRoom' | 'Battle';

interface MultiplayerNavigatorProps {
  initialScreen: Screen;
  onExit: () => void;
}

export const MultiplayerNavigator: React.FC<MultiplayerNavigatorProps> = ({ 
  initialScreen,
  onExit
}) => {
  const { isAuthenticated, isConnected, activeGame } = useMultiplayer();
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialScreen);

  // Handle automatic navigation based on context state
  useEffect(() => {
    console.log('Navigator state update:', { isAuthenticated, isConnected, activeGame, currentScreen });
    
    if (!isAuthenticated) {
      console.log('Navigator: Not authenticated, setting screen to Auth');
      setCurrentScreen('Auth');
      return;
    }
    
    // If authenticated but not connected, don't navigate yet - loading screen will show
    if (!isConnected) {
      console.log('Navigator: Authenticated but waiting for connection');
      return;
    }
    
    if (activeGame) {
      if (activeGame.status === 'waiting') {
        console.log('Navigator: Game waiting, setting screen to WaitingRoom');
        setCurrentScreen('WaitingRoom');
      } else if (activeGame.status === 'active' || 
                activeGame.status === 'completed' || 
                activeGame.status === 'abandoned') {
        console.log('Navigator: Game active/completed/abandoned, setting screen to Battle');
        setCurrentScreen('Battle');
      }
    } else if (isAuthenticated && isConnected) {
      console.log('Navigator: Authenticated and connected, setting screen to Lobby');
      setCurrentScreen('Lobby');
    }
  }, [isAuthenticated, isConnected, activeGame]);

  // Handle screen transitions
  const handleAuthSuccess = () => {
    setCurrentScreen('Lobby');
  };

  // Render current screen
  const renderScreen = () => {
    // Show loading if connecting (but only after authentication)
    if (!isConnected && currentScreen !== 'Auth') {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Connecting to server...</Text>
          <Text style={styles.helpText}>
            If this takes too long, please check your network connection and ensure the server is running.
          </Text>
        </View>
      );
    }
    
    switch (currentScreen) {
      case 'Auth':
        return (
          <AuthScreen 
            onAuthSuccess={handleAuthSuccess} 
            onBack={onExit} 
          />
        );
      case 'Lobby':
        return (
          <MultiplayerLobbyScreen />
        );
      case 'WaitingRoom':
        return (
          <GameWaitingRoom />
        );
      case 'Battle':
        return (
          <OnlineBattleScreen />
        );
      default:
        return null;
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#555',
  },
  helpText: {
    marginTop: 10,
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default MultiplayerNavigator;
