/**
 * Card Battle Explorer color scheme
 * Modern design with a primary green color (#00ba38) and clean interfaces
 */

const primaryColor = '#00ba38';
const primaryColorLight = '#4ddb75';
const primaryColorDark = '#008e2b';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: primaryColor,
    primary: primaryColor,
    primaryLight: primaryColorLight,
    primaryDark: primaryColorDark,
    secondary: '#FF9800',
    error: '#F44336',
    success: primaryColor,
    warning: '#FFC107',
    info: '#2196F3',
    lightGray: '#F5F5F5',
    mediumGray: '#E0E0E0',
    darkGray: '#9E9E9E',
    icon: '#505050',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: primaryColor,
    cardBattleTable: '#8B4513',
    rarity: {
      common: '#A9A9A9',
      rare: '#4682B4',
      very_rare: '#9370DB',
      epic: '#FF8C00',
      spectacular: '#FF1493',
    }
  },
  dark: {
    text: '#000000', // Keeping black text per requirements even in dark mode
    background: '#FAFAFA', // Slightly off-white for dark mode
    tint: primaryColor,
    primary: primaryColor,
    primaryLight: primaryColorLight,
    primaryDark: primaryColorDark,
    secondary: '#FF9800',
    error: '#F44336',
    success: primaryColor,
    warning: '#FFC107',
    info: '#2196F3',
    lightGray: '#F5F5F5',
    mediumGray: '#E0E0E0',
    darkGray: '#9E9E9E',
    icon: '#505050',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: primaryColor,
    cardBattleTable: '#8B4513',
    rarity: {
      common: '#A9A9A9',
      rare: '#4682B4',
      very_rare: '#9370DB',
      epic: '#FF8C00',
      spectacular: '#FF1493',
    }
  },
};
