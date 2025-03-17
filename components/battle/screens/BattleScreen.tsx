import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BattleProvider, useBattle } from '../contexts/BattleContext';
import { CardComponent } from '../components/CardComponent';
import { Card } from '../models/Card';
import { getStarterDeck } from '../data/cardData';

// Types
interface BattleScreenProps {
  onExit?: () => void;
  onBattleEnd?: (won: boolean, cardsWon: Card[]) => void;
  playerDeck?: Card[];
  opponentDeck?: Card[];
}

// Main component wrapper with BattleProvider
export const BattleScreen: React.FC<BattleScreenProps> = (props) => {
  return (
    <BattleProvider>
      <BattleScreenContent {...props} />
    </BattleProvider>
  );
};

// Inner component with access to battle context
const BattleScreenContent: React.FC<BattleScreenProps> = ({
  onExit,
  onBattleEnd,
  playerDeck,
  opponentDeck,
}) => {
  const insets = useSafeAreaInsets();
  const {
    state,
    startBattle,
    playCard,
    useAbility,
    selectCard,
    selectAbility,
    selectTarget,
    endTurn,
    endBattle,
  } = useBattle();
  
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const { width: screenWidth } = Dimensions.get('window');
  
  // Start battle when component mounts
  useEffect(() => {
    startBattle(playerDeck || getStarterDeck(), opponentDeck);
  }, [startBattle, playerDeck, opponentDeck]);
  
  // Monitor battle end
  useEffect(() => {
    if (!state.isActive && state.winner !== null && onBattleEnd) {
      const playerWon = state.winner === 'player1';
      const cardsWon = state.battleResult?.cardsWon || [];
      
      // Call the onBattleEnd callback
      onBattleEnd(playerWon, cardsWon);
    }
  }, [state.isActive, state.winner, state.battleResult, onBattleEnd]);
  
  // Handle card selection from hand
  const handleSelectHandCard = (cardId: string) => {
    if (state.activePlayerId !== 'player1') return; // Only allow on player's turn
    
    const card = state.players.player1.hand.find(c => c.id === cardId);
    if (card) {
      if (selectedHandCardId === cardId) {
        // If already selected, play the card
        playCard('player1', cardId);
        setSelectedHandCardId(null);
      } else {
        // Select the card
        setSelectedHandCardId(cardId);
        selectCard(card);
      }
    }
  };
  
  // Handle field card selection (for targeting)
  const handleSelectFieldCard = (playerId: string, cardId: string) => {
    if (state.activePlayerId !== 'player1' || !state.selectedAbilityId) return;
    
    const card = state.players[playerId].field.find(c => c.id === cardId);
    if (card) {
      useAbility('player1', state.selectedCard?.id || '', state.selectedAbilityId, cardId);
      selectCard(null);
      selectAbility(null);
      selectTarget(null);
    }
  };
  
  // Handle ability selection
  const handleSelectAbility = (cardId: string, abilityId: string) => {
    if (state.activePlayerId !== 'player1') return;
    
    const card = state.players.player1.field.find(c => c.id === cardId);
    if (!card) return;
    
    const ability = card.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    
    selectCard(card);
    
    if (ability.targetType === 'self') {
      // Self-targeting ability, use immediately
      useAbility('player1', cardId, abilityId);
      selectCard(null);
    } else {
      // Select the ability and wait for target selection
      selectAbility(abilityId);
    }
  };
  
  // Handle end turn
  const handleEndTurn = () => {
    if (state.activePlayerId === 'player1') {
      endTurn();
    }
  };
  
  // Handle AI turn
  useEffect(() => {
    if (state.activePlayerId === 'player2' && state.isActive) {
      // Simple AI: wait a bit and then play a random card if possible
      const timeoutId = setTimeout(() => {
        const aiHand = state.players.player2.hand;
        
        if (aiHand.length > 0) {
          // Find a card the AI can afford to play
          const playableCards = aiHand.filter(
            card => card.energyCost <= state.players.player2.energy
          );
          
          if (playableCards.length > 0) {
            // Play a random card
            const randomIndex = Math.floor(Math.random() * playableCards.length);
            playCard('player2', playableCards[randomIndex].id);
            
            // Wait a bit before ending turn
            setTimeout(() => {
              if (state.activePlayerId === 'player2') {
                endTurn();
              }
            }, 1000);
          } else {
            // No playable cards, end turn
            endTurn();
          }
        } else {
          // No cards in hand, end turn
          endTurn();
        }
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.activePlayerId, state.isActive, state.players.player2, playCard, endTurn]);
  
  // Render game log
  const renderGameLog = () => {
    return (
      <ScrollView
        style={styles.logContainer}
        contentContainerStyle={styles.logContent}
      >
        {state.logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    );
  };
  
  // Render player's hand
  const renderPlayerHand = () => {
    const hand = state.players.player1.hand;
    return (
      <ScrollView
        horizontal
        contentContainerStyle={[styles.handContainer, { paddingBottom: insets.bottom }]}
        showsHorizontalScrollIndicator={false}
      >
        {hand.map(card => (
          <TouchableOpacity
            key={card.id}
            onPress={() => handleSelectHandCard(card.id)}
            disabled={state.activePlayerId !== 'player1'}
          >
            <CardComponent
              card={card}
              size="small"
              isSelectable={state.activePlayerId === 'player1'}
              isSelected={selectedHandCardId === card.id}
              style={[styles.handCard, { opacity: state.activePlayerId === 'player1' ? 1 : 0.7 }]}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Render player's field
  const renderPlayerField = () => {
    const field = state.players.player1.field;
    return (
      <ScrollView
        horizontal
        contentContainerStyle={styles.fieldContainer}
        showsHorizontalScrollIndicator={false}
      >
        {field.map(card => (
          <View key={card.id} style={styles.fieldCardContainer}>
            <CardComponent
              card={card}
              size="medium"
              isSelectable={
                state.activePlayerId === 'player1' &&
                state.selectedAbilityId !== null &&
                state.selectedCard?.id !== card.id
              }
              isSelected={state.selectedCard?.id === card.id}
              style={styles.fieldCard}
              onPress={() => handleSelectFieldCard('player1', card.id)}
            />
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.abilitiesContainer}>
              {card.abilities.map(ability => {
                const cooldown = card.abilityCooldowns[ability.id] || 0;
                const canUse = cooldown === 0 && state.activePlayerId === 'player1';
                return (
                  <TouchableOpacity
                    key={ability.id}
                    style={[
                      styles.abilityButton,
                      !canUse && styles.disabledAbilityButton,
                    ]}
                    onPress={() => 
                      canUse && handleSelectAbility(card.id, ability.id)}
                    disabled={!canUse}
                  >
                    <Text style={styles.abilityButtonText}>
                      {ability.name} ({ability.energyCost})
                    </Text>
                    {cooldown > 0 && (
                      <Text style={styles.cooldownText}>CD: {cooldown}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    );
  };
  
  // Render opponent's field
  const renderOpponentField = () => {
    const field = state.players.player2.field;
    return (
      <ScrollView
        horizontal
        contentContainerStyle={styles.fieldContainer}
        showsHorizontalScrollIndicator={false}
      >
        {field.map(card => (
          <TouchableOpacity
            key={card.id}
            onPress={() => handleSelectFieldCard('player2', card.id)}
            disabled={
              state.activePlayerId !== 'player1' ||
              !state.selectedAbilityId ||
              !state.selectedCard
            }
            style={[
              state.activePlayerId === 'player1' &&
                state.selectedAbilityId &&
                styles.targetableCard,
            ]}
          >
            <CardComponent
              card={card}
              size="medium"
              isSelectable={
                state.activePlayerId === 'player1' &&
                state.selectedAbilityId !== null
              }
              style={styles.fieldCard}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  // Render opponent's hand (face down)
  const renderOpponentHand = () => {
    const handCount = state.players.player2.hand.length;
    const cards = Array(handCount).fill(null);
    
    return (
      <ScrollView
        horizontal
        contentContainerStyle={[styles.handContainer, { paddingTop: insets.top }]}
        showsHorizontalScrollIndicator={false}
      >
        {cards.map((_, index) => (
          <View key={index} style={[styles.handCard, styles.opponentHandCard]}>
            <CardComponent
              card={state.players.player2.hand[0]} // Just for sizing, we'll show card back
              size="small"
              showBack
            />
          </View>
        ))}
      </ScrollView>
    );
  };
  
  // Render game info
  const renderGameInfo = () => {
    const player = state.players.player1;
    const opponent = state.players.player2;
    
    return (
      <View style={styles.gameInfoContainer}>
        <View style={styles.playerInfo}>
          <Text style={styles.energyText}>
            Energy: {player.energy}/{player.maxEnergy}
          </Text>
          <Text style={styles.deckText}>
            Deck: {player.deck.length} | Discard: {player.discardPile.length}
          </Text>
        </View>
        
        <View style={styles.turnInfo}>
          <Text style={styles.turnText}>Turn {state.currentTurn}</Text>
          <Text style={[
            styles.activePlayerText, 
            state.activePlayerId === 'player1' ? styles.playerActive : styles.opponentActive
          ]}>
            {state.activePlayerId === 'player1' ? 'Your Turn' : 'Opponent Turn'}
          </Text>
        </View>
        
        <View style={styles.opponentInfo}>
          <Text style={styles.energyText}>
            Energy: {opponent.energy}/{opponent.maxEnergy}
          </Text>
          <Text style={styles.deckText}>
            Deck: {opponent.deck.length} | Discard: {opponent.discardPile.length}
          </Text>
        </View>
      </View>
    );
  };
  
  // Render action buttons
  const renderActionButtons = () => {
    return (
      <View style={[styles.actionButtons, { marginBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            state.activePlayerId !== 'player1' && styles.disabledActionButton,
          ]}
          onPress={handleEndTurn}
          disabled={state.activePlayerId !== 'player1'}
        >
          <Text style={styles.actionButtonText}>End Turn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            if (onExit) {
              Alert.alert(
                'Exit Battle',
                'Are you sure you want to forfeit this battle?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Forfeit',
                    style: 'destructive',
                    onPress: () => {
                      endBattle('player2'); // Player forfeits
                      onExit();
                    },
                  },
                ]
              );
            }
          }}
        >
          <Text style={styles.actionButtonText}>Forfeit</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Show battle result modal if battle is over
  useEffect(() => {
    if (!state.isActive && state.winner) {
      const playerWon = state.winner === 'player1';
      
      Alert.alert(
        playerWon ? 'Victory!' : 'Defeat',
        playerWon
          ? `You won the battle!\nGained ${state.battleResult?.playerXp || 0} XP\nGained ${
              state.battleResult?.cardsWon.length || 0
            } new card(s)`
          : 'You lost the battle.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (onExit) {
                onExit();
              }
            },
          },
        ]
      );
    }
  }, [state.isActive, state.winner, state.battleResult, onExit]);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Opponent's hand */}
      {renderOpponentHand()}
      
      {/* Game info */}
      {renderGameInfo()}
      
      {/* Opponent's field */}
      {renderOpponentField()}
      
      {/* Game log */}
      {renderGameLog()}
      
      {/* Player's field */}
      {renderPlayerField()}
      
      {/* Action buttons */}
      {renderActionButtons()}
      
      {/* Player's hand */}
      {renderPlayerHand()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gameInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#e0e0e0',
  },
  playerInfo: {
    alignItems: 'flex-start',
  },
  turnInfo: {
    alignItems: 'center',
  },
  opponentInfo: {
    alignItems: 'flex-end',
  },
  energyText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deckText: {
    fontSize: 12,
  },
  turnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activePlayerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerActive: {
    color: 'green',
  },
  opponentActive: {
    color: 'red',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    maxHeight: 80,
  },
  logContent: {
    padding: 5,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  handContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#e8e8e8',
  },
  handCard: {
    marginHorizontal: 5,
  },
  opponentHandCard: {
    transform: [{ rotate: '180deg' }],
  },
  fieldContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  fieldCardContainer: {
    marginHorizontal: 5,
  },
  fieldCard: {
    marginBottom: 5,
  },
  abilitiesContainer: {
    flexDirection: 'row',
    maxHeight: 40,
  },
  abilityButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  disabledAbilityButton: {
    backgroundColor: '#95a5a6',
  },
  abilityButtonText: {
    color: 'white',
    fontSize: 10,
  },
  cooldownText: {
    color: 'white',
    fontSize: 8,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledActionButton: {
    backgroundColor: '#95a5a6',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  targetableCard: {
    borderWidth: 2,
    borderColor: '#e74c3c',
    borderRadius: 10,
  },
});
