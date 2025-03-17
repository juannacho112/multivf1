import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import { ThemedText } from '../../ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface DialogBoxProps {
  text: string;
  speaker?: string | null;
  onComplete?: () => void;
  isVisible: boolean;
}

export const DialogBox: React.FC<DialogBoxProps> = ({
  text,
  speaker,
  onComplete,
  isVisible,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [animationValue] = useState(new Animated.Value(0));
  
  // Text typing animation
  useEffect(() => {
    if (!isVisible) {
      setDisplayText('');
      setIsComplete(false);
      return;
    }
    
    // Reset when new text comes in
    setDisplayText('');
    setIsComplete(false);
    
    if (text.length === 0) return;
    
    // Character-by-character text animation
    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character
    
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsComplete(true);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  }, [text, isVisible]);
  
  // Box slide animation
  useEffect(() => {
    Animated.timing(animationValue, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, animationValue]);
  
  // Skip to the end of text when tapped
  const handleTap = () => {
    if (!isComplete) {
      // Show all text immediately
      setDisplayText(text);
      setIsComplete(true);
    } else if (onComplete) {
      // Text is already complete, proceed
      onComplete();
    }
  };
  
  // Animation styles
  const translateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], // Slide up from bottom
  });
  
  const opacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });
  
  if (!isVisible) return null;
  
  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            transform: [{ translateY }],
            opacity,
          }
        ]}
      >
        {speaker && (
          <View style={styles.speakerContainer}>
            <ThemedText style={styles.speakerText}>{speaker}</ThemedText>
          </View>
        )}
        
        <View style={styles.textContainer}>
          <ThemedText style={styles.text}>{displayText}</ThemedText>
          
          {isComplete && (
            <View style={styles.continueIndicator}>
              <Ionicons name="chevron-down" size={20} color="#FFF" />
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 100,
  },
  speakerContainer: {
    backgroundColor: '#4527A0',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignSelf: 'flex-start',
  },
  speakerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 15,
    borderRadius: 10,
    minHeight: 80,
    position: 'relative',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
  },
  continueIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
