import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

export const MultiplayerLobbyScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentUser,
    isConnected,
    activeGame,
    joinMatchmaking,
    leaveMatchmaking,
    createGame,
    joinGameByCode,
    matchmaking
  } = useMultiplayer();
  
  const [gameCode, setGameCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Handle matchmaking
  const handleMatchmaking = () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      joinMatchmaking();
      // Navigation will happen via the context when matched
    } catch (error) {
      console.error('Matchmaking error:', error);
      setErrorMessage('Failed to join matchmaking. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle creating a new game
  const handleCreateGame = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await createGame(false);
      // Navigation will happen via context when game is created
    } catch (error) {
      console.error('Create game error:', error);
      setErrorMessage('Failed to create game. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle creating a private game
  const handleCreatePrivateGame = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await createGame(true);
      // Navigation will happen via context when game is created
    } catch (error) {
      console.error('Create private game error:', error);
      setErrorMessage('Failed to create private game. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle joining a game by code
  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      setErrorMessage('Please enter a valid game code.');
      return;
    }
    
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const success = await joinGameByCode(gameCode.trim());
      if (!success) {
        throw new Error('Failed to join game');
      }
      // Navigation will happen via context when game is joined
    } catch (error) {
      console.error('Join game error:', error);
      setErrorMessage('Failed to join game. Please check the code and try again.');
      setIsLoading(false);
    }
  };

  // Handle cancel matchmaking
  const handleCancelMatchmaking = () => {
    leaveMatchmaking();
    setIsLoading(false);
  };
  
  useEffect(() => {
    console.log("MultiplayerLobbyScreen mounted");
    console.log(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`Current user: ${currentUser ? JSON.stringify(currentUser) : 'No user'}`);
  }, [isConnected, currentUser]);

  useEffect(() => {
    // If user is in a game, auto-navigate
    if (activeGame) {
      console.log("Game detected, auto-navigating");
      setIsLoading(false); // Reset loading in case we were in a loading state
    }
  }, [activeGame]);
  
  // Check connection status
  if (!isConnected) {
    console.log('Lobby screen showing disconnected state');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.centerContainer}>
          <Text style={styles.titleText}>Connecting to server...</Text>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.subtitleText}>Please wait while we connect to the VeeFriends server</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render matchmaking UI
  if (matchmaking.inQueue) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.centerContainer}>
          <Text style={styles.titleText}>Finding Opponent</Text>
          <ActivityIndicator size="large" color="#4CAF50" style={styles.spinner} />
          
          {matchmaking.queuePosition && (
            <Text style={styles.queueText}>
              Position in queue: {matchmaking.queuePosition}/{matchmaking.queueSize || '?'}
            </Text>
          )}
          
          <Text style={styles.queueText}>
            Time in queue: {matchmaking.timeInQueue}s
          </Text>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelMatchmaking}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render loading state
  if (isLoading) {
    console.log('Lobby screen showing loading state');
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.centerContainer}>
          <Text style={styles.titleText}>Please wait...</Text>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleText}>VeeFriends Multiplayer</Text>
          {currentUser && (
            <Text style={styles.welcomeText}>
              Welcome, {currentUser.displayName || currentUser.username}!
            </Text>
          )}
          
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
        </View>
        
        {/* Game Mode Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>About VeeFriends Multiplayer</Text>
          <Text style={styles.descriptionText}>
            Challenge other players with your cards' Skill, Stamina, and Aura attributes.
            Win by reaching 7 points in any attribute first!
          </Text>
        </View>
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Matchmaking */}
          <TouchableOpacity 
            style={[styles.optionButton, styles.primaryButton]}
            onPress={handleMatchmaking}
          >
            <Text style={styles.optionButtonText}>Quick Match</Text>
            <Text style={styles.optionButtonSubtext}>Find an opponent to play against</Text>
          </TouchableOpacity>
          
          {/* Create Game */}
          <TouchableOpacity 
            style={[styles.optionButton, styles.secondaryButton]}
            onPress={handleCreateGame}
          >
            <Text style={styles.optionButtonText}>Create Game</Text>
            <Text style={styles.optionButtonSubtext}>Create a public game that anyone can join</Text>
          </TouchableOpacity>
          
          {/* Create Private Game */}
          <TouchableOpacity 
            style={[styles.optionButton, styles.secondaryButton]}
            onPress={handleCreatePrivateGame}
          >
            <Text style={styles.optionButtonText}>Create Private Game</Text>
            <Text style={styles.optionButtonSubtext}>Create a game with a code to share with friends</Text>
          </TouchableOpacity>
          
          {/* Join Game */}
          <View style={styles.joinGameContainer}>
            <Text style={styles.joinGameLabel}>Join a game with code:</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                style={styles.codeInput}
                value={gameCode}
                onChangeText={setGameCode}
                placeholder="Enter game code"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.joinButton, !gameCode.trim() && styles.disabledButton]}
                onPress={handleJoinGame}
                disabled={!gameCode.trim()}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // This should exit the entire multiplayer flow and go back to the main menu
            if (navigation && navigation.goBack) {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>Exit Multiplayer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  optionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  joinGameContainer: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  joinGameLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  joinButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1C4E9',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#757575',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    width: '100%',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  spinner: {
    marginVertical: 20,
  },
  queueText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default MultiplayerLobbyScreen;
