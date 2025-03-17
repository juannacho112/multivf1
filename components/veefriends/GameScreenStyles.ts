import { StyleSheet } from 'react-native';

export const createGameScreenStyles = (colors: any) => StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    padding: 16,
  },
  
  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  roundBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  roundText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  potBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  burnPileBadge: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  potText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  burnPileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Main game area
  gameArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactGameArea: {
    flexDirection: 'column',
  },
  
  // Scoreboard section
  scoreboardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreboardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aiScoreboardContainer: {
    backgroundColor: '#F8F8F8',
  },
  compactScoreboard: {
    padding: 8,
    marginHorizontal: 4,
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  challengerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  challengerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
    marginLeft: 4,
  },
  tokenBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  
  // Points display
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  winningPoint: {
    borderWidth: 0,
  },
  pointValue: {
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 2,
  },
  winningPointText: {
    color: 'white',
  },
  deckCount: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.7,
  },
  
  // Cards section
  cardsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
  },
  cardArea: {
    width: 160,
    height: 230,
  },
  smallCardArea: {
    width: 120,
    height: 180,
  },
  
  // Game info
  gameInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  phaseIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  phaseText: {
    textAlign: 'center',
    fontSize: 14,
  },
  challengeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 4,
  },
  challengeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Controls section
  controlsSection: {
    marginTop: 8,
  },
  controls: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  controlsTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  attributeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  compactAttributeButtons: {
    flexWrap: 'wrap',
  },
  attributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
    position: 'relative',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  selectedAttribute: {
    borderWidth: 2,
  },
  deniedAttribute: {
    opacity: 0.5,
  },
  attributeText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  deniedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  strikeThrough: {
    position: 'absolute',
    height: 2,
    width: '100%',
    transform: [{ rotate: '45deg' }],
  },
  
  // Terrific token button
  terrificButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  terrificText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  
  // Accept/Deny buttons
  acceptDenyButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 120,
  },
  denyButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 6,
  },
  
  // Game log
  logContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 16,
    maxHeight: 100,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  logBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  logBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  logScroll: {
    maxHeight: 80,
  },
  logContent: {
    paddingVertical: 4,
  },
  logEntry: {
    marginTop: 4,
  },
});
