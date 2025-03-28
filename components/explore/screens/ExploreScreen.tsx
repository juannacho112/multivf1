import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExplore } from '../contexts/ExploreContext';
import { MapRenderer } from '../components/MapRenderer';
import { DialogBox } from '../components/DialogBox';
import { GameBoyFrame } from '../components/GameBoyFrame';
import { GameBoyControls } from '../components/GameBoyControls';
import { BattleScreen } from '../../battle/screens/BattleScreen';
import { BattleProvider } from '../../battle/contexts/BattleContext';
import { getStarterDeck } from '../../battle/data/cardData';

interface Props {
  navigation?: any;
}

export const ExploreScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { state, startDialog, endDialog, movePlayer, startBattle, endBattle } = useExplore();
  const { 
    player, 
    map, 
    ui, 
    interaction: { 
      isDialogActive, 
      dialogText, 
      nearbyObject,
      isBattleActive 
    } 
  } = state;

  const [battleStarted, setBattleStarted] = useState(false);
  const screenHeight = Dimensions.get('window').height;
  const gameplayHeight = screenHeight - 200; // Approximate height accounting for controls
  
  // Listen for when a player is near the table
  useEffect(() => {
    if (nearbyObject?.id === 'card_table' && !isDialogActive && !isBattleActive) {
      startDialog("Press A to start a card battle!");
    }
  }, [nearbyObject, isDialogActive, isBattleActive]);
  
  // Handle movement
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (isDialogActive || isBattleActive) return;
    movePlayer(direction);
  };
  
  // Handle button press
  const handleButtonPress = (button: string) => {
    if (button === 'a' && isDialogActive) {
      if (nearbyObject?.id === 'card_table') {
        // Start battle
        startBattle();
        setBattleStarted(true);
      } else {
        // Close dialog
        endDialog();
      }
    } else if (button === 'b' && isDialogActive) {
      // Close dialog
      endDialog();
    }
  };
  
  // Handle exiting battle
  const handleExitBattle = () => {
    setBattleStarted(false);
    endBattle();
    
    // Show victory dialog
    startDialog("You've completed the battle!");
  };
  
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="auto" />
      
      {/* Battle mode */}
      {(isBattleActive && battleStarted) ? (
        <BattleProvider>
          <BattleScreen 
            onExit={handleExitBattle}
            playerDeck={getStarterDeck()}
          />
        </BattleProvider>
      ) : (
        /* Exploration mode */
        <GameBoyFrame>
          <View style={styles.gameScreen}>
            {/* Map and player */}
            <MapRenderer 
              mapPath="json_tiled_Map_uploads/officemain.tmj"
              tilesetPaths={{
                Floors_only_32x32: require('/home/office/Desktop/VsCode-Project1/GitClones/TestRepoApp/json_tiled_Map_uploads/Assets/Modern_Office_Revamped_v1.2/Floors_only_32x32.png')
              }}
            />
            
            {/* Dialog box */}
            <DialogBox 
              text={dialogText} 
              isVisible={isDialogActive} 
              onComplete={endDialog} 
            />
          </View>
          
          {/* Controls */}
          <GameBoyControls 
            onDirectionPress={handleMove}
            onAPress={() => handleButtonPress('a')}
            onBPress={() => handleButtonPress('b')}
            onStartPress={() => handleButtonPress('start')}
            onSelectPress={() => handleButtonPress('select')}
          />
        </GameBoyFrame>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gameScreen: {
    flex: 1,
    position: 'relative',
  }
});
