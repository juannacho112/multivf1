import React, { createContext, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';

// Define the shape of the navigation context
interface DeckNavigationContextProps {
  navigateToDeckEditor: (deckId: string) => void;
  goBack?: () => void;
  // Add a flag to determine if we need confirmation before going back (e.g. in game screens)
  requireConfirmationOnBack?: boolean;
}

// Create the context with default values
export const DeckNavigationContext = createContext<DeckNavigationContextProps>({
  navigateToDeckEditor: () => {},
});

// Provider component for Navigation Context
interface DeckNavigationProviderProps {
  children: ReactNode;
  value: DeckNavigationContextProps;
}

export const DeckNavigationProvider: React.FC<DeckNavigationProviderProps> = ({ 
  children, 
  value 
}) => {
  return (
    <DeckNavigationContext.Provider value={value}>
      {children}
    </DeckNavigationContext.Provider>
  );
};

// Custom hook for using deck navigation
export const useDeckNavigation = () => {
  return useContext(DeckNavigationContext);
};

// Custom hook that adds confirmation for games
export const useGameNavigation = (onConfirmQuit: () => void) => {
  const navigation = useContext(DeckNavigationContext);
  
  const handleBackWithConfirmation = () => {
    if (navigation.requireConfirmationOnBack) {
      // Show confirmation dialog
      Alert.alert(
        'Quit Game',
        'Are you sure you want to quit the current game? All progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Quit', style: 'destructive', onPress: onConfirmQuit }
        ]
      );
    } else if (navigation.goBack) {
      navigation.goBack();
    }
  };
  
  return {
    ...navigation,
    goBackWithConfirmation: handleBackWithConfirmation
  };
};
