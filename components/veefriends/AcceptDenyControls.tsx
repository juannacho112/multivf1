import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { createGameScreenStyles } from './GameScreenStyles';

interface AcceptDenyControlsProps {
  colors: any;
  onRespond: (accept: boolean) => void;
}

export const AcceptDenyControls: React.FC<AcceptDenyControlsProps> = ({
  colors,
  onRespond,
}) => {
  const styles = createGameScreenStyles(colors);
  
  return (
    <View style={[
      styles.controls,
      {backgroundColor: colors.background, borderColor: colors.mediumGray}
    ]}>
      <ThemedText type="subtitle" style={styles.controlsTitle}>
        Accept or Deny the challenge
      </ThemedText>
      
      <View style={styles.acceptDenyButtons}>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.primary}]}
          onPress={() => onRespond(true)}
        >
          <Ionicons name="checkmark" size={20} color="#FFF" />
          <ThemedText style={styles.actionButtonText}>Accept</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.denyButton]}
          onPress={() => onRespond(false)}
        >
          <Ionicons name="close" size={20} color="#FFF" />
          <ThemedText style={styles.actionButtonText}>Deny</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
