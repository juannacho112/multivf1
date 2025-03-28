import express from 'express';
import gameController from '../controllers/gameController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all game routes
router.use(authMiddleware.verifyToken);

// Game routes
router.post('/create', gameController.createGame);
router.get('/active', gameController.getActiveGames);
router.post('/join/:gameId', gameController.joinGame);
router.post('/join-by-code/:gameCode', gameController.joinGameByCode);
router.get('/:gameId', gameController.getGameById);
router.post('/matchmaking/join', gameController.joinMatchmaking);
router.post('/matchmaking/leave', gameController.leaveMatchmaking);

export default router;
