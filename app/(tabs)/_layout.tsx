import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light']?.tint || '#2196F3';
  const backgroundColor = colorScheme === 'dark' ? '#1c1c1c' : '#ffffff';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: false,
        // Simple styling without custom components to avoid href/tabBarButton conflicts
        tabBarStyle: {
          backgroundColor,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.1)',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => {
            try {
              return <IconSymbol size={28} name="house.fill" color={color} />;
            } catch (error) {
              console.warn('Error rendering tab icon:', error);
              return null;
            }
          },
        }}
      />
    </Tabs>
  );
}
