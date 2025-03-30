import React, { useEffect, useState } from 'react';
import { View, Dimensions, Alert, ActivityIndicator, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { OnlineBattleScreenProps } from '../types/ComponentProps';

// Import components from single player veefriends
import { EnhancedFlippableCard } from '../../veefriends/EnhancedFlippableCard';
import { VictoryScreen } from '../../veefriends/VictoryScreen';
import { RoundResultScreen } from '../../veefriends/RoundResultScreen';
import { GameHeader } from '../../veefriends/GameHeader';
import { PlayerScoreboard } from '../../veefriends/PlayerScoreboard';
import { GameInfo } from '../../veefriends/GameInfo';
import { AttributeSelector } from '../../veefriends/AttributeSelector';
import { AcceptDenyControls } from '../../veefriends/AcceptDenyControls';
import { GameLog } from '../../veefriends/GameLog';
import { Colors } from '../../../constants/Colors';

// Import styles
import { createGameScreenStyles } from '../../veefriends/GameScreenStyles';

// Import types
import { ChallengeAttribute, Card, Player } from '../../../models/Card';

// Component that displays the online battle screen - based on the single player GameScreen
const OnlineBattleScreen: React.FC<OnlineBattleScreenProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const {
    currentUser,
    activeGame,
    leaveGame,
    // VeeFriends specific actions
    drawCards,
    selectAttribute,
    respondToChallenge,
    resolveChallenge
  } = useMultiplayer();

  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const styles = createGameScreenStyles(colors);
  
  // Game state management
  const [showVictory, setShowVictory] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundWinner, setRoundWinner] = useState<'player1' | 'player2' | null>(null);
  const [roundPointsAwarded, setRoundPointsAwarded] = useState(1);
  const [lastCardsInPlay, setLastCardsInPlay] = useState<{
    player1: Card | null;
    player2: Card | null;
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
      <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{marginTop: 20, fontSize: 18, color: colors.text}}>Loading game...</Text>
      </SafeAreaView>
    );
  }

  // Get player positions and current state
  const currentPlayerIndex = activeGame.players.findIndex(
    p => p.userId === currentUser?.id
  );
  
  const isPlayer1 = currentPlayerIndex === 0;
  const isCurrentChallenger = activeGame.currentChallenger === (isPlayer1 ? 'player1' : 'player2');
  const playerPosition = isPlayer1 ? 'player1' : 'player2';
  const opponentPosition = isPlayer1 ? 'player2' : 'player1';
  
  // Convert multiplayer game state to match single player format
  const player1: Player = {
    id: 'player1', // Using the literal 'player1' as required by Player interface
    name: isPlayer1 ? 'You' : activeGame.players[0].username,
    points: activeGame.players[0].points,
    terrificTokenUsed: activeGame.players[0].terrificTokenUsed || false,
    deck: (activeGame.players[0].deck || []) as Card[],
    hand: [] // Required by type but not used in UI
  };
  
  const player2: Player = {
    id: 'player2', // Using the literal 'player2' as required by Player interface
    name: isPlayer1 ? activeGame.players[1].username : 'You',
    points: activeGame.players[1].points,
    terrificTokenUsed: activeGame.players[1].terrificTokenUsed || false,
    deck: (activeGame.players[1].deck || []) as Card[],
    hand: [] // Required by type but not used in UI
  };
  
  // Handle card reveal animation when challenge is accepted
  useEffect(() => {
    if (activeGame.phase === 'resolve' && !revealCards) {
      setIsAnimating(true);
      setRevealCards(true);
      
      // Reset reveal state when phase changes back
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    } else if (activeGame.phase !== 'resolve') {
      setRevealCards(false);
    }
  }, [activeGame.phase]);
  
  // Auto-draw cards at the beginning
  useEffect(() => {
    const noCardsInPlay = !activeGame.cardsInPlay.player1 && !activeGame.cardsInPlay.player2;
    if (activeGame.phase === 'draw' && noCardsInPlay) {
      drawCards();
    }
  }, [activeGame.phase, activeGame.cardsInPlay, drawCards]);
  
  // Handle resolving challenges
  useEffect(() => {
    // If it's resolve phase, save cards for the round result display
    if (activeGame.phase === 'resolve') {
      if (activeGame.cardsInPlay.player1 && activeGame.cardsInPlay.player2) {
        setLastCardsInPlay({
          player1: activeGame.cardsInPlay.player1 as unknown as Card,
          player2: activeGame.cardsInPlay.player2 as unknown as Card,
        });
        
        if (activeGame.challengeAttribute) {
          setLastChallengeAttribute(activeGame.challengeAttribute as ChallengeAttribute);
          setRoundPointsAwarded(activeGame.potSize);
        }
      }
    }
  }, [activeGame.phase, activeGame.cardsInPlay, activeGame.challengeAttribute, activeGame.potSize]);
  
  // If game is over, show victory screen
  useEffect(() => {
    if (activeGame.status === 'completed' && activeGame.winner && !showVictory && !showRoundResult) {
      // Short delay before showing victory screen for better UX
      setTimeout(() => {
        setShowVictory(true);
      }, 800);
    }
  }, [activeGame.status, activeGame.winner, showRoundResult]);

  // Function to determine round winner
  const determineRoundWinner = (
    player1Card: Card | null,
    player2Card: Card | null, 
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
  
  // Handle continuing from round result
  const handleContinueFromRoundResult = () => {
    setShowRoundResult(false);
    setLastCardsInPlay({ player1: null, player2: null });
  };

  // Handle play again
  const handlePlayAgain = () => {
    setShowVictory(false);
    leaveGame();
    if (onBack) {
      onBack();
    }
  };

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

  // If the game has ended but we're not showing the victory screen yet
  if (activeGame.status === 'abandoned') {
    return (
      <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <Text style={{fontSize: 36, fontWeight: 'bold', color: '#f39c12', marginBottom: 16}}>
          Game Abandoned
        </Text>
        <Text style={{fontSize: 18, color: '#7f8c8d', textAlign: 'center', marginBottom: 32}}>
          Your opponent left the game.
        </Text>
        <TouchableOpacity
          style={{backgroundColor: '#3498db', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8}}
          onPress={() => {
            leaveGame();
            if (onBack) {
              onBack();
            }
          }}
        >
          <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Return to Lobby</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={[
      styles.container, 
      {
        backgroundColor: colors.background,
        paddingHorizontal: 20, // Add extra horizontal padding
      }
    ]}>
      {/* Victory screen overlay */}
      {showVictory && activeGame.winner && (
        <VictoryScreen 
          winner={activeGame.winner === playerPosition ? player1 : player2}
          loser={activeGame.winner === playerPosition ? player2 : player1}
          onPlayAgain={handlePlayAgain}
          onExit={() => {
            leaveGame();
            if (onBack) onBack();
          }}
        />
      )}
      
      {/* Round result overlay */}
      {showRoundResult && (
        <RoundResultScreen 
          playerCard={lastCardsInPlay[playerPosition]}
          opponentCard={lastCardsInPlay[opponentPosition]}
          playerName={isPlayer1 ? 'You' : activeGame.players[1].username}
          opponentName={isPlayer1 ? activeGame.players[0].username : 'You'}
          winner={roundWinner === playerPosition ? playerPosition : roundWinner === opponentPosition ? opponentPosition : null}
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
        onExit={handleForfeit}
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
              card={activeGame.cardsInPlay[opponentPosition] as unknown as Card}
              faceDown={activeGame.phase !== 'resolve'}
              flipToFront={activeGame.phase === 'resolve'}
              manualFlip={false}
              useEnhancedDesign={true}
            />
          </View>
          
          {/* Center game info */}
          <GameInfo 
            phase={activeGame.phase as any}
            currentChallenger={activeGame.currentChallenger}
            challengeAttribute={activeGame.challengeAttribute as ChallengeAttribute}
            colors={colors}
          />
          
          {/* Player Card - Always visible */}
          <View style={[styles.cardArea, isSmallScreen && styles.smallCardArea]}>
            <EnhancedFlippableCard
              card={activeGame.cardsInPlay[playerPosition] as unknown as Card}
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
              availableAttributes={activeGame.availableAttributes as ChallengeAttribute[]}
              deniedAttributes={activeGame.deniedAttributes as ChallengeAttribute[]}
              challengeAttribute={activeGame.challengeAttribute as ChallengeAttribute}
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
        </View>
      </View>
      
      {/* Game log at the bottom */}
      <GameLog 
        roundNumber={activeGame.roundNumber}
        challengeAttribute={activeGame.challengeAttribute as ChallengeAttribute}
        currentChallenger={activeGame.currentChallenger}
        potSize={activeGame.potSize}
        burnPileLength={activeGame.burnPile?.length || 0}
        deniedAttributes={activeGame.deniedAttributes as ChallengeAttribute[]}
        colors={colors}
      />
    </View>
  );
};

export default OnlineBattleScreen;
