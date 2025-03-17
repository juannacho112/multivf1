import React from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface InteractiveTableProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  mapOffset: { x: number; y: number };
  onInteract: () => void;
  isNearPlayer: boolean;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({
  position,
  size,
  mapOffset,
  onInteract,
  isNearPlayer,
}) => {
  // Animation for the pulsating effect when player is near
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isNearPlayer) {
      // Start pulsating animation when player is near
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animation when player moves away
      pulseAnim.setValue(1);
    }

    return () => {
      // Clean up animation
      pulseAnim.stopAnimation();
    };
  }, [isNearPlayer, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.tableContainer,
        {
          left: position.x - mapOffset.x,
          top: position.y - mapOffset.y,
          width: size.width,
          height: size.height,
          transform: [{ scale: isNearPlayer ? pulseAnim : 1 }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.table}
        onPress={isNearPlayer ? onInteract : undefined}
        activeOpacity={isNearPlayer ? 0.7 : 1}
        disabled={!isNearPlayer}
      >
        <Ionicons name="grid" size={size.width * 0.4} color="#FFFFFF" />
        {isNearPlayer && (
          <View style={styles.interactBadge}>
            <Ionicons name="game-controller" size={16} color="#FFF" />
            <ThemedText style={styles.interactText}>Battle!</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    position: 'absolute',
    zIndex: 50,
  },
  table: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  interactBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#FF9800',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  interactText: {
    color: '#FFF',
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default InteractiveTable;
