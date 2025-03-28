import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect user routes
router.use(authMiddleware.verifyToken);

// User routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/stats', userController.getStats);
router.get('/friends', userController.getFriends);
router.post('/friends/add/:userId', userController.addFriend);
router.delete('/friends/remove/:userId', userController.removeFriend);

export default router;
