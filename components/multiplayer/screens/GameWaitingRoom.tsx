import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Share
} from 'react-native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

export const GameWaitingRoom: React.FC = () => {
  const navigation = useNavigation();
  const {
    activeGame,
    currentUser,
    setReady,
    leaveGame
  } = useMultiplayer();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!activeGame) {
      navigation.goBack();
    }
  }, [activeGame, navigation]);
  
  // Get the current player
  const currentPlayer = activeGame?.players.find(
    player => player.userId === currentUser?.id
  );
  
  // Get the opponent player
  const opponentPlayer = activeGame?.players.find(
    player => player.userId !== currentUser?.id
  );
  
  // When the user toggles ready state
  const handleToggleReady = () => {
    setIsReady(!isReady);
    setReady(!isReady);
  };
  
  // Handle leaving the game
  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            leaveGame();
            navigation.goBack();
          }
        }
      ]
    );
  };
  
  // Share game code
  const handleShareCode = async () => {
    if (!activeGame?.gameCode) return;
    
    try {
      await Share.share({
        message: `Join my card game with code: ${activeGame.gameCode}`
      });
    } catch (error) {
      console.error('Error sharing game code:', error);
    }
  };
  
  // If no active game yet, show loading
  if (!activeGame) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Get all players ready status
  const isAllReady = activeGame.players.every(player => player.isReady);
  
  // If all ready, show starting countdown
  if (isAllReady) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <Text style={styles.titleText}>All players ready!</Text>
          <Text style={styles.subtitleText}>Game starting...</Text>
          <ActivityIndicator size="large" color="#4CAF50" style={styles.spinner} />
          <Text style={styles.loadingText}>
            The game will begin in a moment. Prepare your strategy!
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.titleText}>Game Lobby</Text>
        <Text style={styles.gameCodeText}>Game Code: {activeGame.gameCode}</Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShareCode}
        >
          <Text style={styles.shareButtonText}>Share Code</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.playersContainer}>
        <Text style={styles.sectionTitle}>Players</Text>
        
        {/* Current player */}
        <View style={styles.playerCard}>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>
              {currentPlayer?.displayName || currentPlayer?.username || 'You'}
              {' '}<Text style={styles.youText}>(You)</Text>
            </Text>
            {currentPlayer?.isReady && (
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>Ready</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.readyButton,
              currentPlayer?.isReady ? styles.notReadyButton : styles.readyButtonActive
            ]}
            onPress={handleToggleReady}
          >
            <Text style={styles.readyButtonText}>
              {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Opponent player (or waiting for player) */}
        <View style={styles.playerCard}>
          {opponentPlayer ? (
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {opponentPlayer.displayName || opponentPlayer.username || 'Opponent'}
              </Text>
              {opponentPlayer.isReady && (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>Ready</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.playerInfo}>
              <Text style={styles.waitingText}>Waiting for opponent...</Text>
              <ActivityIndicator size="small" color="#9C27B0" style={styles.smallSpinner} />
            </View>
          )}
        </View>
      </View>
      
      {/* Game info */}
      <View style={styles.gameInfoContainer}>
        <Text style={styles.sectionTitle}>Game Info</Text>
        <Text style={styles.infoText}>
          • This is a turn-based card game where strategy is key
        </Text>
        <Text style={styles.infoText}>
          • Both players must be ready to start the game
        </Text>
        <Text style={styles.infoText}>
          • Each player starts with 3 energy and a hand of cards
        </Text>
        <Text style={styles.infoText}>
          • Play cards from your hand to the field
        </Text>
        <Text style={styles.infoText}>
          • Use card abilities to attack your opponent's cards
        </Text>
        <Text style={styles.infoText}>
          • Win by defeating all of your opponent's cards
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.leaveButton}
        onPress={handleLeaveGame}
      >
        <Text style={styles.leaveButtonText}>Leave Game</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 20,
    color: '#555',
    marginBottom: 16,
  },
  spinner: {
    marginTop: 24,
    marginBottom: 8,
  },
  smallSpinner: {
    marginLeft: 8,
  },
  gameCodeText: {
    fontSize: 18,
    color: '#9C27B0',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  shareButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  playersContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  youText: {
    fontWeight: 'normal',
    color: '#666',
    fontStyle: 'italic',
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  readyBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  readyBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  readyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  readyButtonActive: {
    backgroundColor: '#4CAF50',
  },
  notReadyButton: {
    backgroundColor: '#F44336',
  },
  readyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  gameInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  leaveButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameWaitingRoom;
