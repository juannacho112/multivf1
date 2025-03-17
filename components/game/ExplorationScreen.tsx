import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useGame } from '../../contexts/GameContext';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ExplorationScreenProps {
  onStartBattle: () => void;
}

export const ExplorationScreen: React.FC<ExplorationScreenProps> = ({ onStartBattle }) => {
  const { state, movePlayer } = useGame();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));
  const [interactiveObjects, setInteractiveObjects] = useState<Array<{ id: string; x: number; y: number; type: string; interactionRadius: number }>>([]);
  const [nearbyObject, setNearbyObject] = useState<string | null>(null);
  
  // Set up interactive objects
  useEffect(() => {
    // These would come from a level design file in a real game
    setInteractiveObjects([
      { id: 'table1', x: 180, y: 120, type: 'table', interactionRadius: 30 },
      { id: 'chest1', x: 80, y: 200, type: 'chest', interactionRadius: 25 },
      { id: 'npc1', x: 240, y: 220, type: 'npc', interactionRadius: 35 }
    ]);
  }, []);
  
  // Update window dimensions when the screen resizes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    
    return () => subscription?.remove?.();
  }, []);
  
  // Check for nearby objects
  useEffect(() => {
    const playerX = state.playerPosition.x;
    const playerY = state.playerPosition.y;
    
    // Find the closest object within interaction range
    let closestObject = null;
    let closestDistance = Infinity;
    
    interactiveObjects.forEach(obj => {
      const distance = Math.sqrt(
        Math.pow(playerX - obj.x, 2) + 
        Math.pow(playerY - obj.y, 2)
      );
      
      if (distance <= obj.interactionRadius && distance < closestDistance) {
        closestObject = obj.id;
        closestDistance = distance;
      }
    });
    
    setNearbyObject(closestObject);
  }, [state.playerPosition, interactiveObjects]);
  
  const handleInteract = () => {
    if (nearbyObject) {
      // In a full game, we would have different interactions for different object types
      // For this prototype, any interaction starts a battle
      onStartBattle();
    }
  };
  
  const getObjectImage = (type: string) => {
    switch (type) {
      case 'table':
        return '🎮'; // Simple emoji representation for table
      case 'chest':
        return '📦'; // Simple emoji representation for chest
      case 'npc':
        return '🧙'; // Simple emoji representation for NPC
      default:
        return '❓';
    }
  };
  
  // Constrain map to visible area
  const mapWidth = Math.min(windowDimensions.width, 400);
  const mapHeight = Math.min(windowDimensions.height * 0.7, 300);
  
  return (
    <View style={styles.container}>
      {/* Game title */}
      <View style={styles.titleContainer}>
        <ThemedText style={styles.titleText}>Card Battle Explorer</ThemedText>
      </View>
      
      {/* Map area */}
      <View style={[styles.mapContainer, { width: mapWidth, height: mapHeight, backgroundColor: colors.lightGray || '#f0f0f0' }]}>
        {/* Map objects */}
        {interactiveObjects.map(obj => (
          <View 
            key={obj.id} 
            style={[
              styles.mapObject,
              { 
                left: obj.x - 15, 
                top: obj.y - 15,
                opacity: nearbyObject === obj.id ? 1 : 0.7,
                transform: [{ scale: nearbyObject === obj.id ? 1.2 : 1 }]
              }
            ]}
          >
            <ThemedText style={styles.objectEmoji}>{getObjectImage(obj.type)}</ThemedText>
          </View>
        ))}
        
        {/* Player character */}
        <View 
          style={[
            styles.player, 
            { 
              left: state.playerPosition.x - 10, 
              top: state.playerPosition.y - 10,
              backgroundColor: colors.primary
            }
          ]}
        />
      </View>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Directional pad */}
        <View style={styles.dPad}>
          <TouchableOpacity 
            style={[styles.dPadButton, styles.dPadTop]}
            onPress={() => movePlayer('up')}
          >
            <Ionicons name="chevron-up" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.dPadMiddleRow}>
            <TouchableOpacity 
              style={[styles.dPadButton, styles.dPadLeft]}
              onPress={() => movePlayer('left')}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={[styles.dPadCenter, { backgroundColor: colors.lightGray }]} />
            
            <TouchableOpacity 
              style={[styles.dPadButton, styles.dPadRight]}
              onPress={() => movePlayer('right')}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.dPadButton, styles.dPadBottom]}
            onPress={() => movePlayer('down')}
          >
            <Ionicons name="chevron-down" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Action button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: nearbyObject ? colors.primary : colors.lightGray },
            !nearbyObject && { opacity: 0.6 }
          ]}
          onPress={handleInteract}
          disabled={!nearbyObject}
        >
          <ThemedText style={[styles.actionButtonText, nearbyObject && { color: 'white' }]}>
            {nearbyObject ? 'Interact' : 'Explore'}
          </ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* Instruction text */}
      {nearbyObject && (
        <View style={styles.instructionContainer}>
          <ThemedText style={styles.instructionText}>
            Press Interact to start a card battle!
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mapContainer: {
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  player: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  mapObject: {
    width: 30,
    height: 30,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectEmoji: {
    fontSize: 24,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dPad: {
    width: 130,
    height: 130,
  },
  dPadButton: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#e1e1e1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  dPadTop: {
    top: 0,
    left: 45,
  },
  dPadMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 45,
    left: 0,
    width: '100%',
  },
  dPadLeft: {
  },
  dPadCenter: {
    width: 40,
    height: 40,
    borderRadius: 5,
  },
  dPadRight: {
  },
  dPadBottom: {
    bottom: 0,
    left: 45,
  },
  actionButton: {
    width: 100,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
