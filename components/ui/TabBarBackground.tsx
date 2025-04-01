import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

/**
 * TabBarBackground component that provides a proper background for the tab bar
 * Works across all platforms including web
 */
export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? '#1c1c1c' : '#ffffff' }
      ]} 
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  }
});
