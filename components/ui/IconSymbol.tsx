// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle, View, Text } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  // Add more mappings as needed
  'default': 'circle', // Fallback icon
};

// Define the type safely
export type IconSymbolName = keyof typeof MAPPING;
export type SymbolWeight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName | string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  try {
    // Safely get the mapped name or use the default
    const iconName = MAPPING[name as IconSymbolName] || MAPPING['default'];
    
    return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
  } catch (error) {
    console.warn('Error rendering IconSymbol:', error);
    // Fallback to a simple colored box if icon rendering fails
    return (
      <View 
        style={[
          { 
            width: size, 
            height: size, 
            backgroundColor: typeof color === 'string' ? color : '#ccc',
            borderRadius: size / 4 
          },
          style
        ]}
      />
    );
  }
}
