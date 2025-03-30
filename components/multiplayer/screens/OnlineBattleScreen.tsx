import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { OnlineBattleScreenProps } from '../types/ComponentProps';
import { ChallengeAttribute } from '../../../models/Card';
import { useColorScheme } from 'react-native';
import { Colors } from '../../../constants/Colors';

// Import all the VeeFriends components
import { EnhancedFlippableCard } from '../../veefriends/EnhancedFlippableCard';
import { FlippableCard } from '../../veefriends/FlippableCard';
import { VictoryScreen } from '../../veefriends/VictoryScreen';
import { RoundResultScreen } from '../../veefriends/RoundResultScreen';
import { GameHeader } from '../../veefriends/GameHeader';
import { PlayerScoreboard } from '../../veefriends/PlayerScoreboard';
import { GameInfo } from '../../veefriends/GameInfo';
import { AttributeSelector } from '../../veefriends/AttributeSelector';
import { AcceptDenyControls } from '../../veefriends/AcceptDenyControls';
import { GameLog } from '../../veefriends/GameLog';
import { createGameScreenStyles } from '../../veefriends/GameScreenStyles';

// Component that displays the online battle screen using the VeeFriends UI components
export const OnlineBattleScreen: React.FC<OnlineBattleScreenProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const styles = createGameScreenStyles(colors);
  
  const {
    currentUser,
    activeGame,
    leaveGame,
    drawCards,
    selectAttribute,
    respondToChallenge,
    resolveChallenge
  } = useMultiplayer();

  // UI state
  const [showVictory, setShowVictory] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundWinner, setRoundWinner] = useState<'player1' | 'player2' | null>(null);
  const [roundPointsAwarded, setRoundPointsAwarded] = useState(1);
  const [lastCardsInPlay, setLastCardsInPlay] = useState<{
    player1: any | null;
    player2: any | null;
  }>({ player1: null, player2: null });
  const [lastChallengeAttribute, setLastChallengeAttribute] = useState<ChallengeAttribute | null>(null);
  const [revealCards, setRevealCards] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  
  // Screen size for responsiveness
  useEffect(() => {
    const updateLayout = () => {
      setWindowWidth(Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateLayout);
    return () => {
      // Clean up
    };
  }, []);

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = windowWidth < 480;
  
  useEffect(() => {
    if (!activeGame) {
      if (onBack) {
        onBack();
      } else if (navigation && navigation.goBack) {
        navigation.goBack();
      }
    }
  }, [activeGame, navigation, onBack]);

  // If no active game, show loading
  if (!activeGame) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 20, fontSize: 18, color: '#666' }}>
            Loading game...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get player positions
  const currentPlayerIndex = activeGame.players.findIndex(
    p => p.userId === currentUser?.id
  );
  
  const isPlayer1 = currentPlayerIndex === 0;
  const currentPosition = isPlayer1 ? 'player1' : 'player2';
  const opponentPosition = isPlayer1 ? 'player2' : 'player1';
  const isCurrentChallenger = activeGame.currentChallenger === currentPosition;

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
            if (onBack) {
              onBack();
            } else if (navigation && navigation.goBack) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  // Handle continuing from round result
  const handleContinueFromRoundResult = () => {
    setShowRoundResult(false);
    setLastCardsInPlay({ player1: null, player2: null });
  };

  // Handle when a round completes and we need to show results
  useEffect(() => {
    if (activeGame.phase === 'draw' && lastCardsInPlay.player1 && lastCardsInPlay.player2) {
      // This means a round just completed (phase changed from resolve to draw)
      // and we have card data to show results for
      setTimeout(() => {
        if (!activeGame.winner) {
          // If game is not over, show round results
          setShowRoundResult(true);
        }
      }, 600);
    }
  }, [activeGame.phase, lastCardsInPlay]);

  // Effect to track card reveals
  useEffect(() => {
    if (activeGame.phase === 'resolve' && !revealCards) {
      setIsAnimating(true);
      setRevealCards(true);
      
      // Save the current state for round result display
      if (activeGame.cardsInPlay.player1 && activeGame.cardsInPlay.player2) {
        setLastCardsInPlay({
          player1: activeGame.cardsInPlay.player1,
          player2: activeGame.cardsInPlay.player2,
        });
        
        if (activeGame.challengeAttribute) {
          setLastChallengeAttribute(activeGame.challengeAttribute);
        }
        
        // Save current pot size for points display
        setRoundPointsAwarded(activeGame.potSize);
        
        // Calculate winner for this round
        const winner = determineRoundWinner(
          activeGame.cardsInPlay.player1,
          activeGame.cardsInPlay.player2,
          activeGame.challengeAttribute
        );
        setRoundWinner(winner);
      }
      
      // Reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    } else if (activeGame.phase !== 'resolve') {
      setRevealCards(false);
    }
  }, [activeGame.phase]);
  
  // If game is over, show victory screen
  useEffect(() => {
    if (activeGame.status === 'completed' && !showVictory && !showRoundResult) {
      // Short delay before showing victory screen for better UX
      setTimeout(() => {
        setShowVictory(true);
      }, 800);
    }
  }, [activeGame.status, showRoundResult]);
  
  // Function to determine round winner
  const determineRoundWinner = (
    player1Card: any | null,
    player2Card: any | null, 
    challengeAttribute: ChallengeAttribute | null
  ): 'player1' | 'player2' | null => {
    if (!player1Card || !player2Card || !challengeAttribute) {
      return null;
    }
    
    let player1Value, player2Value;
    
    // Get values to compare based on challenge attribute
    if (challengeAttribute === 'total') {
      player1Value = player1Card.finalTotal;
      player2Value = player2Card.finalTotal;
    } else {
      player1Value = player1Card[challengeAttribute] || 0;
      player2Value = player2Card[challengeAttribute] || 0;
    }
    
    // Return the winner or null if tie
    if (player1Value > player2Value) {
      return 'player1';
    } else if (player2Value > player1Value) {
      return 'player2';
    }
    
    return null;
  };

  // If the game has ended, show a result screen (this is a fallback in case victory screen doesn't show)
  if (activeGame.status === 'completed' || activeGame.status === 'abandoned') {
    const playerWon = activeGame.winner === currentPosition;
    const gameAbandoned = activeGame.status === 'abandoned';
    
    if (!showVictory) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="auto" />
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            {gameAbandoned ? (
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: '#f39c12',
                marginBottom: 16,
              }}>Game Abandoned</Text>
            ) : (
              <Text style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: playerWon ? '#2ecc71' : '#e74c3c',
                marginBottom: 16,
              }}>
                {playerWon ? 'Victory!' : 'Defeat'}
              </Text>
            )}
            
            <Text style={{
              fontSize: 18,
              color: '#7f8c8d',
              textAlign: 'center',
              marginBottom: 32,
            }}>
              {gameAbandoned 
                ? 'Your opponent left the game.'
                : playerWon 
                  ? 'Congratulations! You won the match.' 
                  : 'Better luck next time!'}
            </Text>
            
            <View style={{
              backgroundColor: '#3498db',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
              }}
                onPress={() => {
                  leaveGame();
                  if (onBack) {
                    onBack();
                  } else if (navigation && navigation.goBack) {
                    navigation.goBack();
                  }
                }}
              >
                Return to Lobby
              </Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }
  }

  // Format player data for the UI components
  const player1 = {
    name: activeGame.players[0]?.username || 'Player 1',
    points: activeGame.players[0]?.points || { skill: 0, stamina: 0, aura: 0 },
    terrificTokenUsed: activeGame.players[0]?.terrificTokenUsed || false,
    deckCount: activeGame.players[0]?.deckCount || 0
  };

  const player2 = {
    name: activeGame.players[1]?.username || 'Player 2',
    points: activeGame.players[1]?.points || { skill: 0, stamina: 0, aura: 0 },
    terrificTokenUsed: activeGame.players[1]?.terrificTokenUsed || false,
    deckCount: activeGame.players[1]?.deckCount || 0
  };

  return (
    <View style={[
      styles.container, 
      {
        backgroundColor: colors.background,
        paddingHorizontal: 20, 
      }
    ]}>
      {/* Victory screen overlay */}
      {showVictory && (
        <VictoryScreen 
          winner={activeGame.winner === 'player1' ? player1 : player2}
          loser={activeGame.winner === 'player1' ? player2 : player1}
          onPlayAgain={() => {
            setShowVictory(false);
            leaveGame();
            if (onBack) {
              onBack();
            }
          }}
          onExit={() => {
            leaveGame();
            if (onBack) {
              onBack();
            }
          }}
        />
      )}
      
      {/* Round result overlay */}
      {showRoundResult && (
        <RoundResultScreen 
          playerCard={isPlayer1 ? lastCardsInPlay.player1 : lastCardsInPlay.player2}
          opponentCard={isPlayer1 ? lastCardsInPlay.player2 : lastCardsInPlay.player1}
          playerName={isPlayer1 ? player1.name : player2.name}
          opponentName={isPlayer1 ? player2.name : player1.name}
          winner={roundWinner}
          challengeAttribute={lastChallengeAttribute}
          pointsAwarded={roundPointsAwarded}
          onContinue={handleContinueFromRoundResult}
        />
      )}
    
      {/* Game header */}
      <GameHeader 
        roundNumber={activeGame.roundNumber}
        potSize={activeGame.potSize}
        burnPileLength={activeGame.burnPile?.length || 0}
        onExit={() => {
          handleForfeit();
        }}
        colors={colors}
      />
      
      {/* Main game area */}
      <View style={[
        styles.gameArea, 
        isSmallScreen && styles.compactGameArea
      ]}>
        {/* Scoreboard */}
        <View style={styles.scoreboardSection}>
          <PlayerScoreboard 
            player={player2}
            playerId="player2"
            currentChallenger={activeGame.currentChallenger}
            isSmallScreen={isSmallScreen}
            colors={colors}
          />
          <PlayerScoreboard 
            player={player1}
            playerId="player1"
            currentChallenger={activeGame.currentChallenger}
            isSmallScreen={isSmallScreen}
            colors={colors}
          />
        </View>
      
        {/* Cards area */}
        <View style={styles.cardsSection}>
          {/* Opponent Card - Only visible when being resolved */}
          <View style={[styles.cardArea, isSmallScreen && styles.smallCardArea]}>
            <EnhancedFlippableCard
              card={isPlayer1 ? activeGame.cardsInPlay.player2 : activeGame.cardsInPlay.player1}
              faceDown={activeGame.phase !== 'resolve'}
              flipToFront={activeGame.phase === 'resolve'}
              manualFlip={false}
              useEnhancedDesign={true}
            />
          </View>
          
          {/* Center game info */}
          <GameInfo 
            phase={activeGame.phase}
            currentChallenger={activeGame.currentChallenger}
            challengeAttribute={activeGame.challengeAttribute}
            colors={colors}
          />
          
          {/* Player Card - Always visible */}
          <View style={[styles.cardArea, isSmallScreen && styles.smallCardArea]}>
            <EnhancedFlippableCard
              card={isPlayer1 ? activeGame.cardsInPlay.player1 : activeGame.cardsInPlay.player2}
              faceDown={false}
              manualFlip={false}
              useEnhancedDesign={true}
            />
          </View>
        </View>
          
        {/* Controls Section */}
        <View style={styles.controlsSection}>
          {/* Player controls */}
          {activeGame.phase === 'challengerPick' && isCurrentChallenger && (
            <AttributeSelector 
              availableAttributes={activeGame.availableAttributes || ['skill', 'stamina', 'aura']}
              deniedAttributes={activeGame.deniedAttributes || []}
              challengeAttribute={activeGame.challengeAttribute}
              terrificTokenUsed={isPlayer1 ? player1.terrificTokenUsed : player2.terrificTokenUsed}
              isSmallScreen={isSmallScreen}
              colors={colors}
              onSelectAttribute={selectAttribute}
            />
          )}
          
          {activeGame.phase === 'acceptDeny' && !isCurrentChallenger && (
            <AcceptDenyControls 
              colors={colors}
              onRespond={respondToChallenge}
            />
          )}

          {/* Draw phase */}
          {activeGame.phase === 'draw' && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              paddingVertical: 20,
            }}>
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
              }}>
                <Text 
                  style={{
                    color: colors.white,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                  onPress={() => drawCards()}
                >
                  Draw Cards
                </Text>
              </View>
            </View>
          )}
          
          {/* Resolve phase */}
          {activeGame.phase === 'resolve' && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              paddingVertical: 20,
            }}>
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
              }}>
                <Text 
                  style={{
                    color: colors.white,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                  onPress={() => resolveChallenge()}
                >
                  Resolve Challenge
                </Text>
              </View>
            </View>
          )}

          {/* Waiting states */}
          {activeGame.phase === 'challengerPick' && !isCurrentChallenger && (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 16, color: colors.text }}>
                Waiting for opponent to select attribute...
              </Text>
            </View>
          )}
          
          {activeGame.phase === 'acceptDeny' && isCurrentChallenger && (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 16, color: colors.text }}>
                Waiting for opponent to accept or deny...
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Game log at the bottom */}
      <GameLog 
        roundNumber={activeGame.roundNumber}
        challengeAttribute={activeGame.challengeAttribute}
        currentChallenger={activeGame.currentChallenger}
        potSize={activeGame.potSize}
        burnPileLength={activeGame.burnPile?.length || 0}
        deniedAttributes={activeGame.deniedAttributes || []}
        colors={colors}
      />
    </View>
  );
};

export default OnlineBattleScreen;
