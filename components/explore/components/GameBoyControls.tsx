import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GameBoyControlsProps {
  onDirectionPress?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onAPress?: () => void;
  onBPress?: () => void;
  onStartPress?: () => void;
  onSelectPress?: () => void;
  isSmallScreen?: boolean;
}

export const GameBoyControls: React.FC<GameBoyControlsProps> = ({
  onDirectionPress,
  onAPress,
  onBPress,
  onStartPress,
  onSelectPress,
  isSmallScreen = false,
}) => {
  // Button press handler that calls the appropriate callback
  const handleDirectionPress = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (onDirectionPress) {
      onDirectionPress(direction);
    }
  };
  
  // Calculate sizes based on screen size
  const dpadSize = isSmallScreen ? 100 : 120;
  const actionButtonSize = isSmallScreen ? 36 : 42;
  const menuButtonWidth = isSmallScreen ? 60 : 70;
  const menuButtonHeight = isSmallScreen ? 20 : 25;
  
  return (
    <View style={styles.container}>
      {/* Left side - D-Pad */}
      <View style={styles.leftControls}>
        <View
          style={[
            styles.dpad,
            {
              width: dpadSize,
              height: dpadSize,
            }
          ]}
        >
          {/* Up */}
          <Pressable
            style={[styles.dpadButton, styles.dpadUp]}
            onPress={() => handleDirectionPress('up')}
          >
            <Ionicons name="caret-up" size={24} color="#333" />
          </Pressable>
          
          {/* Down */}
          <Pressable
            style={[styles.dpadButton, styles.dpadDown]}
            onPress={() => handleDirectionPress('down')}
          >
            <Ionicons name="caret-down" size={24} color="#333" />
          </Pressable>
          
          {/* Left */}
          <Pressable
            style={[styles.dpadButton, styles.dpadLeft]}
            onPress={() => handleDirectionPress('left')}
          >
            <Ionicons name="caret-back" size={24} color="#333" />
          </Pressable>
          
          {/* Right */}
          <Pressable
            style={[styles.dpadButton, styles.dpadRight]}
            onPress={() => handleDirectionPress('right')}
          >
            <Ionicons name="caret-forward" size={24} color="#333" />
          </Pressable>
          
          {/* D-Pad center */}
          <View style={styles.dpadCenter} />
        </View>
      </View>
      
      {/* Center - Start/Select buttons */}
      <View style={styles.centerControls}>
        <View style={styles.menuButtonContainer}>
          <Pressable
            style={[
              styles.menuButton,
              {
                width: menuButtonWidth,
                height: menuButtonHeight,
              }
            ]}
            onPress={onSelectPress}
          >
            <Text style={styles.menuButtonText}>SELECT</Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.menuButton,
              {
                width: menuButtonWidth,
                height: menuButtonHeight,
              }
            ]}
            onPress={onStartPress}
          >
            <Text style={styles.menuButtonText}>START</Text>
          </Pressable>
        </View>
      </View>
      
      {/* Right side - Action buttons */}
      <View style={styles.rightControls}>
        <View style={styles.actionButtons}>
          <View style={styles.abRow}>
            <Pressable
              style={[
                styles.actionButton,
                {
                  width: actionButtonSize,
                  height: actionButtonSize,
                  backgroundColor: '#E74C3C', // Red for B
                }
              ]}
              onPress={onBPress}
            >
              <Text style={styles.buttonLabel}>B</Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                {
                  width: actionButtonSize,
                  height: actionButtonSize,
                  backgroundColor: '#3498DB', // Blue for A
                  marginLeft: 20,
                }
              ]}
              onPress={onAPress}
            >
              <Text style={styles.buttonLabel}>A</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  leftControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpad: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadButton: {
    position: 'absolute',
    width: '33%',
    height: '33%',
    backgroundColor: '#95A5A6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  dpadUp: {
    top: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  dpadDown: {
    bottom: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  dpadLeft: {
    left: 0,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  dpadRight: {
    right: 0,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  dpadCenter: {
    width: '33%',
    height: '33%',
    backgroundColor: '#7F8C8D',
    borderRadius: 5,
  },
  actionButtons: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  abRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuButtonContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  menuButton: {
    backgroundColor: '#34495E',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    transform: [{ rotate: '-45deg' }],
  },
  menuButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
