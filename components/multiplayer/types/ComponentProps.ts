// Define prop interfaces for all multiplayer components

export interface MultiplayerLobbyScreenProps {
  onBack?: () => void;
  onGameCreated?: (gameId: string) => void;
}

export interface GameWaitingRoomProps {
  onBack?: () => void;
}

export interface OnlineBattleScreenProps {
  onBack?: () => void;
}
