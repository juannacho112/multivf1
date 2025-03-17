import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { ChallengeAttribute } from '../../models/Card';
import { createGameScreenStyles } from './GameScreenStyles';

interface AttributeSelectorProps {
  availableAttributes: ChallengeAttribute[];
  deniedAttributes: ChallengeAttribute[];
  challengeAttribute: ChallengeAttribute | null;
  terrificTokenUsed: boolean;
  isSmallScreen: boolean;
  colors: any;
  onSelectAttribute: (attribute: ChallengeAttribute, useTerrificToken?: boolean) => void;
}

export const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  availableAttributes,
  deniedAttributes,
  challengeAttribute,
  terrificTokenUsed,
  isSmallScreen,
  colors,
  onSelectAttribute,
}) => {
  const styles = createGameScreenStyles(colors);
  
  // Function to check if an attribute has been denied
  const isAttributeDenied = (attribute: ChallengeAttribute): boolean => {
    return deniedAttributes.includes(attribute);
  };

  // Function to get attribute status
  const getAttributeStatus = (attribute: ChallengeAttribute): 'selected' | 'available' | 'denied' => {
    if (challengeAttribute === attribute) {
      return 'selected';
    }
    
    if (isAttributeDenied(attribute)) {
      return 'denied';
    }
    
    return 'available';
  };
  
  return (
    <View style={[
      styles.controls,
      {backgroundColor: colors.background, borderColor: colors.mediumGray}
    ]}>
      <ThemedText type="subtitle" style={styles.controlsTitle}>
        Choose attribute to challenge
      </ThemedText>
      
      <View style={[
        styles.attributeButtons,
        isSmallScreen && styles.compactAttributeButtons
      ]}>
        <TouchableOpacity
          style={[
            styles.attributeButton, 
            getAttributeStatus('skill') === 'selected' && [styles.selectedAttribute, {borderColor: colors.primary}],
            getAttributeStatus('skill') === 'denied' && styles.deniedAttribute
          ]}
          onPress={() => !isAttributeDenied('skill') && onSelectAttribute('skill')}
          disabled={isAttributeDenied('skill')}
        >
          <Ionicons 
            name="flash" 
            size={20} 
            color={isAttributeDenied('skill') ? colors.darkGray : colors.text} 
          />
          <ThemedText 
            style={[
              styles.attributeText,
              isAttributeDenied('skill') ? styles.deniedText : undefined,
              getAttributeStatus('skill') === 'selected' && {color: colors.primary, fontWeight: 'bold'}
            ]}
          >
            Skill
          </ThemedText>
          {isAttributeDenied('skill') && (
            <View style={[styles.strikeThrough, {backgroundColor: colors.error}]} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.attributeButton, 
            getAttributeStatus('stamina') === 'selected' && [styles.selectedAttribute, {borderColor: colors.primary}],
            getAttributeStatus('stamina') === 'denied' && styles.deniedAttribute
          ]}
          onPress={() => !isAttributeDenied('stamina') && onSelectAttribute('stamina')}
          disabled={isAttributeDenied('stamina')}
        >
          <Ionicons 
            name="fitness" 
            size={20} 
            color={isAttributeDenied('stamina') ? colors.darkGray : colors.text} 
          />
          <ThemedText 
            style={[
              styles.attributeText,
              isAttributeDenied('stamina') ? styles.deniedText : undefined,
              getAttributeStatus('stamina') === 'selected' && {color: colors.primary, fontWeight: 'bold'}
            ]}
          >
            Stamina
          </ThemedText>
          {isAttributeDenied('stamina') && (
            <View style={[styles.strikeThrough, {backgroundColor: colors.error}]} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.attributeButton, 
            getAttributeStatus('aura') === 'selected' && [styles.selectedAttribute, {borderColor: colors.primary}],
            getAttributeStatus('aura') === 'denied' && styles.deniedAttribute
          ]}
          onPress={() => !isAttributeDenied('aura') && onSelectAttribute('aura')}
          disabled={isAttributeDenied('aura')}
        >
          <Ionicons 
            name="sparkles" 
            size={20} 
            color={isAttributeDenied('aura') ? colors.darkGray : colors.text} 
          />
          <ThemedText 
            style={[
              styles.attributeText,
              isAttributeDenied('aura') ? styles.deniedText : undefined,
              getAttributeStatus('aura') === 'selected' && {color: colors.primary, fontWeight: 'bold'}
            ]}
          >
            Aura
          </ThemedText>
          {isAttributeDenied('aura') && (
            <View style={[styles.strikeThrough, {backgroundColor: colors.error}]} />
          )}
        </TouchableOpacity>
      </View>
      
      {!terrificTokenUsed && (
        <TouchableOpacity
          style={[styles.terrificButton, {backgroundColor: colors.primary + '22', borderColor: colors.primary}]}
          onPress={() => onSelectAttribute('total', true)}
        >
          <Ionicons name="star" size={20} color={colors.primary} />
          <ThemedText style={[styles.terrificText, {color: colors.text}]}>
            {isSmallScreen ? 'Use Terrific Token' : 'Use Terrific Token (force Total)'}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};
