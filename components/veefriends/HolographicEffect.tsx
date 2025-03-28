import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing } from 'react-native';
import { useColorScheme } from 'react-native';

interface HolographicEffectProps {
  active?: boolean;
  style?: any;
}

export const HolographicEffect: React.FC<HolographicEffectProps> = ({ 
  active = true, 
  style
}) => {
  const colorScheme = useColorScheme() || 'light';
  const isDark = colorScheme === 'dark';
  
  // Animation values for the holographic effect
  const [shimmerAnim] = useState(new Animated.Value(0));
  const [colorShiftAnim] = useState(new Animated.Value(0));
  
  // Run the animation effect
  useEffect(() => {
    if (active) {
      // Shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: false, // We need to animate non-transform/opacity props
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ]),
      ).start();
      
      // Color shift animation
      Animated.loop(
        Animated.timing(colorShiftAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ).start();
    }
    
    return () => {
      shimmerAnim.setValue(0);
      colorShiftAnim.setValue(0);
    };
  }, [active]);
  
  // Interpolate the shimmer position
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });
  
  // Interpolate the rainbow gradient effect
  const backgroundColor = colorShiftAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      'rgba(255, 0, 140, 0.1)',
      'rgba(255, 140, 0, 0.1)',
      'rgba(0, 255, 140, 0.1)',
      'rgba(0, 140, 255, 0.1)',
      'rgba(140, 0, 255, 0.1)',
      'rgba(255, 0, 140, 0.1)',
    ],
  });
  
  if (!active) {
    return null;
  }
  
  return (
    <View style={[styles.container, style]}>
      {/* Base holographic layer */}
      <Animated.View style={[
        styles.holographicBase,
        { backgroundColor }
      ]} />
      
      {/* Shimmer effect */}
      <Animated.View style={[
        styles.shimmerEffect,
        {
          transform: [{ translateX }],
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.6)',
        }
      ]} />
      
      {/* Prismatic dots pattern */}
      <View style={styles.prismaticPattern} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 12,
  },
  holographicBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerEffect: {
    position: 'absolute',
    top: -50,
    left: -250,
    width: 80,
    height: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '45deg' }],
  },
  prismaticPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // We'd use a pattern image here in a real implementation
    backgroundColor: 'transparent',
  },
});
