import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';

// Simplified placeholder component that displays basic game information
export const OnlineBattleScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentUser,
    activeGame,
    leaveGame,
    sendGameChat,
    // VeeFriends specific actions
    drawCards,
    selectAttribute,
    respondToChallenge,
    resolveChallenge
  } = useMultiplayer();

  useEffect(() => {
    if (!activeGame) {
      navigation.goBack();
    }
  }, [activeGame, navigation]);

  // If no active game, show loading
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

  // Get player positions
  const currentPlayerIndex = activeGame.players.findIndex(
    p => p.userId === currentUser?.id
  );
  
  const isPlayer1 = currentPlayerIndex === 0;
  const isCurrentChallenger = activeGame.currentChallenger === (isPlayer1 ? 'player1' : 'player2');

  // Handle forfeit
  const handleForfeit = () => {
    Alert.alert(
      'Forfeit Game',
      'Are you sure you want to forfeit this game? This will count as a loss.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forfeit',
          style: 'destructive',
          onPress: () => {
            leaveGame();
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Handle game actions based on the current phase
  const handleGameAction = () => {
    switch (activeGame.phase) {
      case 'draw':
        drawCards();
        break;
      case 'challengerPick':
        if (isCurrentChallenger) {
          // In a real implementation, we'd have a UI to select an attribute
          Alert.alert('Select Attribute', 'Which attribute do you want to challenge?', [
            { text: 'Skill', onPress: () => selectAttribute('skill') },
            { text: 'Stamina', onPress: () => selectAttribute('stamina') },
            { text: 'Aura', onPress: () => selectAttribute('aura') }
          ]);
        } else {
          Alert.alert('Waiting', 'Waiting for opponent to select an attribute');
        }
        break;
      case 'acceptDeny':
        if (!isCurrentChallenger) {
          Alert.alert('Challenge', `Accept the ${activeGame.challengeAttribute} challenge?`, [
            { text: 'Accept', onPress: () => respondToChallenge(true) },
            { text: 'Deny', onPress: () => respondToChallenge(false) }
          ]);
        }
        break;
      case 'resolve':
        resolveChallenge();
        break;
      default:
        break;
    }
  };

  // If the game has ended, show a result screen
  if (activeGame.status === 'completed' || activeGame.status === 'abandoned') {
    const playerWon = activeGame.winner === (isPlayer1 ? 'player1' : 'player2');
    const gameAbandoned = activeGame.status === 'abandoned';
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.resultContainer}>
          {gameAbandoned ? (
            <Text style={styles.abandonedText}>Game Abandoned</Text>
          ) : (
            <Text style={playerWon ? styles.winText : styles.loseText}>
              {playerWon ? 'Victory!' : 'Defeat'}
            </Text>
          )}
          
          <Text style={styles.resultSubtext}>
            {gameAbandoned 
              ? 'Your opponent left the game.'
              : playerWon 
                ? 'Congratulations! You won the match.' 
                : 'Better luck next time!'}
          </Text>
          
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => {
              leaveGame();
              navigation.goBack();
            }}
          >
            <Text style={styles.returnButtonText}>Return to Lobby</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.gameInfoContainer}>
        <Text style={styles.titleText}>VeeFriends Multiplayer</Text>
        <Text style={styles.phaseText}>Phase: {activeGame.phase}</Text>
        <Text style={styles.turnText}>
          {isCurrentChallenger ? "Your Turn" : "Opponent's Turn"}
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.playersContainer}>
          {/* Player Information */}
          {activeGame.players.map((player, index) => (
            <View key={index} style={[
              styles.playerCard, 
              player.userId === currentUser?.id ? styles.currentPlayerCard : {}
            ]}>
              <Text style={styles.playerName}>
                {player.username}
                {player.userId === currentUser?.id ? ' (You)' : ''}
              </Text>
              <Text style={styles.playerPoints}>
                Skill: {player.points.skill} | 
                Stamina: {player.points.stamina} | 
                Aura: {player.points.aura}
              </Text>
            </View>
          ))}
        </View>

        {/* Game State Information */}
        <View style={styles.gameStateContainer}>
          <Text style={styles.sectionTitle}>Game State</Text>
          <Text style={styles.gameStateText}>Round: {activeGame.roundNumber}</Text>
          <Text style={styles.gameStateText}>Pot Size: {activeGame.potSize}</Text>
          
          {activeGame.challengeAttribute && (
            <Text style={styles.gameStateText}>
              Challenge Attribute: {activeGame.challengeAttribute}
            </Text>
          )}
          
          {activeGame.deniedAttributes.length > 0 && (
            <Text style={styles.gameStateText}>
              Denied Attributes: {activeGame.deniedAttributes.join(', ')}
            </Text>
          )}
        </View>

        {/* Cards in Play */}
        {(activeGame.cardsInPlay.player1 || activeGame.cardsInPlay.player2) && (
          <View style={styles.cardsInPlayContainer}>
            <Text style={styles.sectionTitle}>Cards in Play</Text>
            
            {activeGame.cardsInPlay.player1 && (
              <View style={styles.cardDetails}>
                <Text style={styles.cardTitle}>Player 1 Card:</Text>
                <Text>{activeGame.cardsInPlay.player1.name}</Text>
                <Text>Skill: {activeGame.cardsInPlay.player1.skill}</Text>
                <Text>Stamina: {activeGame.cardsInPlay.player1.stamina}</Text>
                <Text>Aura: {activeGame.cardsInPlay.player1.aura}</Text>
              </View>
            )}
            
            {activeGame.cardsInPlay.player2 && (
              <View style={styles.cardDetails}>
                <Text style={styles.cardTitle}>Player 2 Card:</Text>
                <Text>{activeGame.cardsInPlay.player2.name}</Text>
                <Text>Skill: {activeGame.cardsInPlay.player2.skill}</Text>
                <Text>Stamina: {activeGame.cardsInPlay.player2.stamina}</Text>
                <Text>Aura: {activeGame.cardsInPlay.player2.aura}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleGameAction}
        >
          <Text style={styles.actionButtonText}>
            {activeGame.phase === 'draw' ? "Draw Cards" :
             activeGame.phase === 'challengerPick' && isCurrentChallenger ? "Select Attribute" :
             activeGame.phase === 'acceptDeny' && !isCurrentChallenger ? "Respond to Challenge" :
             activeGame.phase === 'resolve' ? "Resolve Challenge" : "Waiting..."}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.forfeitButton]}
          onPress={handleForfeit}
        >
          <Text style={styles.actionButtonText}>Forfeit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
  },
  gameInfoContainer: {
    backgroundColor: '#3498db',
    padding: 16,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  turnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  playersContainer: {
    padding: 16,
  },
  playerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  currentPlayerCard: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerPoints: {
    fontSize: 16,
  },
  gameStateContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginTop: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  gameStateText: {
    fontSize: 16,
    marginBottom: 4,
  },
  cardsInPlayContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginTop: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  cardDetails: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  forfeitButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  winText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 16,
  },
  loseText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16,
  },
  abandonedText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 16,
  },
  resultSubtext: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
  },
  returnButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  returnButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnlineBattleScreen;
