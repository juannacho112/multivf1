import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeckNavigation } from '../../contexts/NavigationContext';

interface BackButtonProps {
  onPress?: () => void; // Optional custom onPress handler
  color?: string;       // Optional color override
  size?: number;        // Optional size override
  requireConfirmation?: boolean; // Whether to show confirmation dialog
}

export const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  color = "#4285F4",
  size = 24,
  requireConfirmation = false
}) => {
  const { goBack, requireConfirmationOnBack } = useDeckNavigation();
  
  const handlePress = () => {
    // Use custom handler if provided
    if (onPress) {
      onPress();
      return;
    }
    
    // Otherwise use the default navigation behavior
    if (requireConfirmation || requireConfirmationOnBack) {
      // Show confirmation dialog
      Alert.alert(
        'Go Back',
        'Are you sure you want to go back? Any unsaved progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go Back', 
            style: 'destructive', 
            onPress: () => goBack && goBack() 
          }
        ]
      );
    } else if (goBack) {
      goBack();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={handlePress}
    >
      <Ionicons name="arrow-back" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
  },
});
