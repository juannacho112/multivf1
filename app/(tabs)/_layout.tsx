import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light']?.tint || '#2196F3';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        headerShown: false,
        // Safely handle HapticTab and add error handling
        tabBarButton: (props) => {
          try {
            return <HapticTab {...props} />;
          } catch (error) {
            console.warn('Error rendering TabBarButton:', error);
            return <View {...props} />;
          }
        },
        // Safely handle TabBarBackground
        tabBarBackground: () => {
          try {
            return <TabBarBackground />;
          } catch (error) {
            console.warn('Error rendering TabBarBackground:', error);
            return <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#ffffff' }} />;
          }
        },
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          web: {
            backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#ffffff',
            borderTopWidth: 1,
            borderTopColor: 'rgba(0,0,0,0.1)',
          },
          default: {
            backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#ffffff',
          },
        }),
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
      {/* We need at least one more tab to make the tab bar navigation work properly */}
      <Tabs.Screen
        name="_placeholder"
        options={{
          href: null, // This tab won't be navigable
          tabBarIcon: () => null, // No icon
          tabBarButton: () => null, // No button - won't show in tab bar
        }}
      />
    </Tabs>
  );
}
