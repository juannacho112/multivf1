import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Direction } from '../contexts/ExploreContext';

interface PlayerSpriteProps {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  viewportX: number;
  viewportY: number;
}

// Simple player sprite for now - we'll use a default character
// In a real game, you would load sprite sheets and animate them
export const PlayerSprite: React.FC<PlayerSpriteProps> = ({
  x,
  y,
  direction,
  isMoving,
  viewportX,
  viewportY,
}) => {
  // Calculate visible position (relative to viewport)
  const visibleX = x - viewportX;
  const visibleY = y - viewportY;
  
  // Create a simple character with different colors based on direction
  let spriteColor = '#1976D2'; // Default blue
  
  // Different colors based on direction for simple visualization
  switch (direction) {
    case 'up':
      spriteColor = '#1976D2'; // Blue
      break;
    case 'down':
      spriteColor = '#2196F3'; // Lighter blue
      break;
    case 'left':
      spriteColor = '#0D47A1'; // Darker blue
      break;
    case 'right':
      spriteColor = '#42A5F5'; // Even lighter blue
      break;
  }
  
  // Apply a subtle animation effect if moving
  const animationStyle = isMoving ? { opacity: 0.9 } : {};
  
  return (
    <View
      style={[
        styles.container,
        {
          transform: [{ translateX: visibleX }, { translateY: visibleY }],
        },
      ]}
    >
      {/* Main body */}
      <View style={[styles.body, { backgroundColor: spriteColor }, animationStyle]}>
        {/* Head */}
        <View style={styles.head} />
        
        {/* Eyes - changes based on direction */}
        <View style={[
          styles.eyes,
          direction === 'left' ? styles.eyesLeft : 
          direction === 'right' ? styles.eyesRight : 
          direction === 'up' ? styles.eyesUp : 
          styles.eyesDown
        ]}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
      </View>
      
      {/* Shadow */}
      <View style={styles.shadow} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 32,
    height: 32,
    zIndex: 10,
  },
  body: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    top: 0,
    left: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    position: 'relative',
  },
  eyes: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 14,
  },
  eyesDown: {
    top: 6,
    flexDirection: 'row',
  },
  eyesUp: {
    top: 2,
    flexDirection: 'row',
  },
  eyesLeft: {
    top: 4,
    left: -2,
    flexDirection: 'column',
    height: 12,
    width: 10,
  },
  eyesRight: {
    top: 4,
    right: -2,
    flexDirection: 'column',
    height: 12,
    width: 10,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000',
  },
  shadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    bottom: 0,
    left: 6,
  },
});
