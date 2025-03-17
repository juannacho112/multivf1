import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useGame } from '../../contexts/GameContext';
import { ExplorationScreen } from './ExplorationScreen';
import { GameScreen } from '../veefriends/GameScreen';

interface MainGameProps {
  onExit: () => void;
}

export const MainGame: React.FC<MainGameProps> = ({ onExit }) => {
  const { state, setGameMode } = useGame();
  const [showBattle, setShowBattle] = useState(false);
  
  // Handler for starting a battle from exploration mode
  const handleStartBattle = () => {
    setGameMode('battle');
    setShowBattle(true);
  };
  
  // Handler for returning to exploration mode from battle
  const handleExitBattle = () => {
    setGameMode('exploration');
    setShowBattle(false);
  };
  
  return (
    <View style={styles.container}>
      {/* Show either battle or exploration based on current state */}
      {showBattle ? (
        <GameScreen onExit={handleExitBattle} />
      ) : (
        <ExplorationScreen onStartBattle={handleStartBattle} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
