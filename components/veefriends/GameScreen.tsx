import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { FlippableCard } from './FlippableCard';
import { EnhancedFlippableCard } from './EnhancedFlippableCard';
import { VictoryScreen } from './VictoryScreen';
import { RoundResultScreen } from './RoundResultScreen';
import { GameHeader } from './GameHeader';
import { PlayerScoreboard } from './PlayerScoreboard';
import { GameInfo } from './GameInfo';
import { AttributeSelector } from './AttributeSelector';
import { AcceptDenyControls } from './AcceptDenyControls';
import { GameLog } from './GameLog';
import { useGame } from '../../contexts/GameContext';
import { ChallengeAttribute, Card } from '../../models/Card';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { createGameScreenStyles } from './GameScreenStyles';

interface GameScreenProps {
  onExit: () => void;
  onReset?: () => void;  // Optional reset handler from parent component
}

export const GameScreen: React.FC<GameScreenProps> = ({ onExit, onReset }) => {
  const { state, drawCards, selectAttribute, respondToChallenge, resolveChallenge, resetGame } = useGame();
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
      // Note: In newer RN versions you'd use subscription.remove(), but we'll leave this for compatibility
    };
  }, []);

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = windowWidth < 480;
  
  // Auto-draw cards at the beginning
  useEffect(() => {
    const noCardsInPlay = !state.cardsInPlay.player1 && !state.cardsInPlay.player2;
    if (state.phase === 'draw' && noCardsInPlay) {
      drawCards();
    }
  }, [state.phase, state.cardsInPlay]);

  // AI opponent logic
  useEffect(() => {
    // If it's AI's turn to choose attribute
    if (state.phase === 'challengerPick' && state.currentChallenger === 'player2') {
      setTimeout(() => {
        const card = state.cardsInPlay.player2;
        
        if (card) {
          // Find the highest attribute among available attributes
          let highestAttribute: ChallengeAttribute = state.availableAttributes[0];
          let highestValue = card[highestAttribute] || 0;
          
          for (const attr of state.availableAttributes) {
            const attrValue = card[attr] || 0;
            if (attrValue > highestValue) {
              highestAttribute = attr;
              highestValue = attrValue;
            }
          }
          
          // Use terrific token if available and final total is really good
          const useToken = !state.player2.terrificTokenUsed && card.finalTotal > 70;
          
          selectAttribute(highestAttribute, useToken);
        }
      }, 1500); // Add delay to make it feel like AI is thinking
    }
    
    // AI response to challenge
    if (state.phase === 'acceptDeny' && state.currentChallenger === 'player1') {
      setTimeout(() => {
        const card = state.cardsInPlay.player2;
        
        if (card && state.challengeAttribute) {
          // Accept if the challenged attribute is good for AI
          const threshold = 20; // Threshold for "good" attribute value
          let shouldAccept = false;
          
          if (state.challengeAttribute === 'skill' && card.skill >= threshold) {
            shouldAccept = true;
          } else if (state.challengeAttribute === 'stamina' && card.stamina >= threshold) {
            shouldAccept = true;
          } else if (state.challengeAttribute === 'aura' && card.aura >= threshold) {
            shouldAccept = true;
          } else if (state.challengeAttribute === 'total' && card.finalTotal >= 60) {
            shouldAccept = true;
          }
          
          // 50% chance to accept even if attribute isn't great
          if (!shouldAccept && Math.random() > 0.5) {
            shouldAccept = true;
          }
          
          respondToChallenge(shouldAccept);
        }
      }, 1500);
    }
    
    // AI auto-resolves its turn
    if (state.phase === 'resolve') {
      setTimeout(() => {
        // Save the current state before resolving for round result display
        if (state.cardsInPlay.player1 && state.cardsInPlay.player2) {
          setLastCardsInPlay({
            player1: state.cardsInPlay.player1,
            player2: state.cardsInPlay.player2,
          });
          
          if (state.challengeAttribute) {
            setLastChallengeAttribute(state.challengeAttribute);
          }
          
          // Save current pot size for points display
          setRoundPointsAwarded(state.potSize);
          
          // Calculate winner for this round
          const winner = determineRoundWinner(
            state.cardsInPlay.player1,
            state.cardsInPlay.player2,
            state.challengeAttribute
          );
          setRoundWinner(winner);
        }
        
        // Now resolve the challenge
        resolveChallenge();
        
        // Wait a bit, then show round results
        setTimeout(() => {
          if (!state.winner) {
            // If game is not over, show round results
            setShowRoundResult(true);
          }
        }, 600);
      }, 2000);
    }
  }, [state.phase, state.currentChallenger, state.cardsInPlay, state.challengeAttribute]);
  
  // Handle card reveal animation when challenge is accepted
  useEffect(() => {
    if (state.phase === 'resolve' && !revealCards) {
      setIsAnimating(true);
      setRevealCards(true);
      
      // Reset reveal state when phase changes back
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    } else if (state.phase !== 'resolve') {
      setRevealCards(false);
    }
  }, [state.phase]);
  
  // If game is over, show victory screen
  useEffect(() => {
    if (state.winner && !showVictory && !showRoundResult) {
      // Short delay before showing victory screen for better UX
      setTimeout(() => {
        setShowVictory(true);
      }, 800);
    }
  }, [state.winner, showRoundResult]);
  
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
    
    // Use provided reset handler if available, otherwise use the local context reset
    if (onReset) {
      onReset();
    } else {
      resetGame();
    }
  };

  return (
    <View style={[
      styles.container, 
      {
        backgroundColor: colors.background,
        paddingHorizontal: 20, // Add extra horizontal padding
      }
    ]}>
      {/* Victory screen overlay */}
      {showVictory && (
        <VictoryScreen 
          winner={state.winner === 'player1' ? state.player1 : state.player2}
          loser={state.winner === 'player1' ? state.player2 : state.player1}
          onPlayAgain={handlePlayAgain}
          onExit={onExit}
        />
      )}
      
      {/* Round result overlay */}
      {showRoundResult && (
        <RoundResultScreen 
          playerCard={lastCardsInPlay.player1}
          opponentCard={lastCardsInPlay.player2}
          playerName={state.player1.name}
          opponentName={state.player2.name}
          winner={roundWinner}
          challengeAttribute={lastChallengeAttribute}
          pointsAwarded={roundPointsAwarded}
          onContinue={handleContinueFromRoundResult}
        />
      )}
    
      {/* Game header */}
      <GameHeader 
        roundNumber={state.roundNumber}
        potSize={state.potSize}
        burnPileLength={state.burnPile.length}
        onExit={onExit}
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
            player={state.player2}
            playerId="player2"
            currentChallenger={state.currentChallenger}
            isSmallScreen={isSmallScreen}
            colors={colors}
          />
          <PlayerScoreboard 
            player={state.player1}
            playerId="player1"
            currentChallenger={state.currentChallenger}
            isSmallScreen={isSmallScreen}
            colors={colors}
          />
        </View>
      
        {/* Cards area */}
        <View style={styles.cardsSection}>
          {/* AI Player Card - Only visible when being resolved */}
          <View style={[styles.cardArea, isSmallScreen && styles.smallCardArea]}>
            <EnhancedFlippableCard
              card={state.cardsInPlay.player2}
              faceDown={state.phase !== 'resolve'}
              flipToFront={state.phase === 'resolve'}
              manualFlip={false}
              useEnhancedDesign={true}
            />
          </View>
          
          {/* Center game info */}
          <GameInfo 
            phase={state.phase}
            currentChallenger={state.currentChallenger}
            challengeAttribute={state.challengeAttribute}
            colors={colors}
          />
          
          {/* Player Card - Always visible */}
          <View style={[styles.cardArea, isSmallScreen && styles.smallCardArea]}>
            <EnhancedFlippableCard
              card={state.cardsInPlay.player1}
              faceDown={false}
              manualFlip={false}
              useEnhancedDesign={true}
            />
          </View>
        </View>
          
        {/* Controls Section */}
        <View style={styles.controlsSection}>
          {/* Player controls */}
          {state.phase === 'challengerPick' && state.currentChallenger === 'player1' && (
            <AttributeSelector 
              availableAttributes={state.availableAttributes}
              deniedAttributes={state.deniedAttributes}
              challengeAttribute={state.challengeAttribute}
              terrificTokenUsed={state.player1.terrificTokenUsed}
              isSmallScreen={isSmallScreen}
              colors={colors}
              onSelectAttribute={selectAttribute}
            />
          )}
          
          {state.phase === 'acceptDeny' && state.currentChallenger === 'player2' && (
            <AcceptDenyControls 
              colors={colors}
              onRespond={respondToChallenge}
            />
          )}
        </View>
      </View>
      
      {/* Game log at the bottom */}
      <GameLog 
        roundNumber={state.roundNumber}
        challengeAttribute={state.challengeAttribute}
        currentChallenger={state.currentChallenger}
        potSize={state.potSize}
        burnPileLength={state.burnPile.length}
        deniedAttributes={state.deniedAttributes}
        colors={colors}
      />
    </View>
  );
};
