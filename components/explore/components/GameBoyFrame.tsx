import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ThemedView } from '../../ThemedView';

interface GameBoyFrameProps {
  children: React.ReactNode;
  controlsHeight?: number;
  controlsComponent?: React.ReactNode;
}

export const GameBoyFrame: React.FC<GameBoyFrameProps> = ({
  children,
  controlsHeight = 160,
  controlsComponent,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375;
  
  // Calculate dimensions for the frame
  const frameWidth = screenWidth;
  const frameHeight = screenHeight;
  
  // Calculate screen dimensions (where the game is displayed)
  const screenPadding = isSmallScreen ? 15 : 20;
  const gameScreenWidth = frameWidth - (screenPadding * 2);
  const gameScreenHeight = frameHeight - controlsHeight - (screenPadding * 2);
  
  return (
    <View style={styles.container}>
      <ThemedView style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
        {/* Game screen area */}
        <View style={[
          styles.screenContainer,
          {
            width: gameScreenWidth,
            height: gameScreenHeight,
            marginTop: screenPadding,
          }
        ]}>
          <View style={styles.screenInnerShadow}>
            <View style={styles.screenContent}>
              {/* Game content */}
              {children}
            </View>
          </View>
        </View>
        
        {/* GameBoy logo */}
        <View style={styles.logoContainer}>
          <View style={styles.gameboy}>
            <View style={styles.gameboyLine} />
            <View style={styles.n}>
              <View style={styles.nDot} />
            </View>
          </View>
        </View>
        
        {/* Controls area */}
        <View style={[
          styles.controlsContainer,
          { height: controlsHeight }
        ]}>
          {controlsComponent}
        </View>
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    backgroundColor: '#DADFE3', // Light gray GameBoy color
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#BDC3C7',
  },
  screenContainer: {
    backgroundColor: '#9DB4C0', // Classic GameBoy screen area color
    borderRadius: 8,
    padding: 4,
    overflow: 'hidden',
  },
  screenInnerShadow: {
    flex: 1,
    backgroundColor: '#88A1AD',
    borderRadius: 4,
    padding: 2,
    overflow: 'hidden',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#C7E6DC', // Greenish GameBoy screen
    borderRadius: 2,
    overflow: 'hidden',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  gameboy: {
    width: 100,
    height: 16,
    position: 'relative',
    alignItems: 'center',
  },
  gameboyLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#4B5F6D',
    position: 'absolute',
    top: 7,
  },
  n: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4B5F6D',
    position: 'absolute',
    right: 0,
    top: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DADFE3',
  },
  controlsContainer: {
    width: '100%',
    padding: 10,
  },
});
