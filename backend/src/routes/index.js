import express from 'express';
import authRoutes from './authRoutes.js';
import gameRoutes from './gameRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

// Mount route groups
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/users', userRoutes);

export default router;
