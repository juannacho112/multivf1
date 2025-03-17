import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';

interface PlayerProps {
  position: Animated.ValueXY;
  size: number;
  mapOffset: { x: number; y: number };
}

const Player: React.FC<PlayerProps> = ({ position, size, mapOffset }) => {
  return (
    <Animated.View
      style={[
        styles.player,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: Animated.subtract(position.x, mapOffset.x),
          top: Animated.subtract(position.y, mapOffset.y),
        },
      ]}
    >
      <View style={styles.playerFace}>
        <View style={styles.playerEye} />
        <View style={styles.playerEye} />
        <View style={styles.playerMouth} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  player: {
    position: 'absolute',
    backgroundColor: '#3F51B5',
    borderWidth: 3,
    borderColor: '#303F9F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 100, // Ensure player is above other elements
  },
  playerFace: {
    width: '70%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerEye: {
    width: 8,
    height: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
    margin: 3,
  },
  playerMouth: {
    width: 14,
    height: 6,
    backgroundColor: '#FFF',
    borderRadius: 3,
    marginTop: 5,
  },
});

export default Player;
