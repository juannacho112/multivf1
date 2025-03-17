# Card Battle Explorer

A cross-platform prototype that combines exploration with a card-based battle system built with React Native and Expo.

## Features

### Exploration Mode
- Player movement in a 2D world
- Game Boy inspired UI
- Interactive objects and NPCs
- Dialog system
- Transition to battle mode when approaching interactive objects

### Card Battle Mode
- Card-based battle system
- Turn-based gameplay
- Card abilities and effects
- Energy system for playing cards and using abilities
- Simple AI opponent

## Technical Implementation

The application is built using:
- React Native with Expo
- TypeScript
- React Context for state management
- Component-based architecture

### Project Structure

```
/
├── app/                       # Expo Router app entry point
│   └── (tabs)/                # Tab navigation
│       ├── index.tsx          # Main menu screen
│       └── explore.tsx        # Exploration tab
│
├── components/
│   ├── battle/                # Battle mode components
│   │   ├── components/        # UI components for battle mode
│   │   │   └── CardComponent.tsx
│   │   ├── contexts/          # State management
│   │   │   └── BattleContext.tsx
│   │   ├── data/              # Card game data
│   │   │   └── cardData.ts
│   │   ├── models/            # Type definitions
│   │   │   └── Card.ts
│   │   └── screens/           # Main battle screen
│   │       └── BattleScreen.tsx
│   │
│   ├── explore/               # Exploration mode components
│   │   ├── components/        # UI components
│   │   │   ├── DialogBox.tsx
│   │   │   ├── GameBoyControls.tsx
│   │   │   ├── GameBoyFrame.tsx
│   │   │   ├── MapRenderer.tsx
│   │   │   └── PlayerSprite.tsx
│   │   ├── contexts/          # State management
│   │   │   └── ExploreContext.tsx
│   │   ├── screens/           # Main exploration screen
│   │   │   └── ExploreScreen.tsx
│   │   └── utils/             # Helper utilities
│   │       └── mapUtils.ts
│   │
│   └── MainGame.tsx           # Main game component that coordinates modes
│
└── json_tiled_Map_uploads/    # Map data for exploration mode
    ├── Assets/                # Tileset placeholders
    │   └── tilesets.js
    └── officemain.tmj         # Main map data in Tiled JSON format
```

## Game Modes

### Exploration Mode
The exploration mode features a Game Boy inspired UI with a movable player character. The player can navigate around a 2D map, interact with objects, and trigger dialogs. When the player approaches the card battle table, they can initiate a battle.

### Battle Mode
The battle mode is a card game where players use their deck of cards to battle against an opponent. Each card has abilities that can be used by spending energy. The battle is turn-based, with players drawing cards, playing them to their field, and using abilities to defeat the opponent's cards.

## Implementation Details

### Card System
- Cards have types, rarity levels, stats, and abilities
- Card abilities can target self, opponent, or all cards
- Effects include damage, healing, buffs, debuffs, and special effects

### Map System
- Tiled map editor format (TMJ)
- Collision detection
- Interactive objects
- Viewport management for scrolling

### State Management
- ExploreContext manages the state for exploration mode
- BattleContext manages the state for battle mode
- MainGame component handles transitions between modes

## Running the Project

1. Install dependencies:
```
npm install
```

2. Start the Expo development server:
```
npx expo start
```

3. Run on a device or simulator:
- Press 'a' to run on Android
- Press 'i' to run on iOS
- Press 'w' to run on web

## Future Enhancements

- More card types and abilities
- Expanded map with multiple areas
- Deck building and card collection features
- Multiplayer mode
- Animation improvements
- Sound effects and music
