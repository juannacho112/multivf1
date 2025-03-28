import Game from '../models/Game.js';
import User from '../models/User.js';
import { getRandomCards } from '../utils/cardUtils.js';
import mongoose from 'mongoose';

/**
 * Game controller methods
 */
const gameController = {
  /**
   * Create a new game
   * @route POST /api/games/create
   */
  createGame: async (req, res) => {
    try {
      const { isPrivate = false } = req.body;
      const userId = req.user._id;
      
      // Create a new game
      const game = new Game({
        isPrivate,
        players: [{
          userId,
          username: req.user.username,
          displayName: req.user.displayName || req.user.username,
          isReady: false
        }]
      });
      
      await game.save();
      
      res.status(201).json({
        success: true,
        message: 'Game created successfully',
        game: game.getGameSummary()
      });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the game'
      });
    }
  },
  
  /**
   * Get active games
   * @route GET /api/games/active
   */
  getActiveGames: async (req, res) => {
    try {
      // Find public active games
      const games = await Game.find({
        isPrivate: false,
        status: 'waiting',
        'players.1': { $exists: false } // Has only one player (waiting for opponent)
      }).sort({ createdAt: -1 }).limit(20);
      
      res.status(200).json({
        success: true,
        games: games.map(game => game.getGameSummary())
      });
    } catch (error) {
      console.error('Get active games error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active games'
      });
    }
  },
  
  /**
   * Join a game by ID
   * @route POST /api/games/join/:gameId
   */
  joinGame: async (req, res) => {
    try {
      const { gameId } = req.params;
      const userId = req.user._id;
      
      // Check if game exists
      const game = await Game.findById(gameId);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Game not found'
        });
      }
      
      // Check if game is joinable
      if (game.status !== 'waiting') {
        return res.status(400).json({
          success: false,
          message: 'Game has already started or is completed'
        });
      }
      
      // Check if player is already in the game
      const isPlayerInGame = game.players.some(
        player => player.userId.toString() === userId.toString()
      );
      
      if (isPlayerInGame) {
        return res.status(400).json({
          success: false,
          message: 'You are already in this game'
        });
      }
      
      // Check if game is full
      if (game.players.length >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Game is full'
        });
      }
      
      // Add player to game
      game.players.push({
        userId,
        username: req.user.username,
        displayName: req.user.displayName || req.user.username,
        isReady: false
      });
      
      await game.save();
      
      res.status(200).json({
        success: true,
        message: 'Successfully joined the game',
        game: game.getGameSummary()
      });
    } catch (error) {
      console.error('Join game error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join the game'
      });
    }
  },
  
  /**
   * Join game by code
   * @route POST /api/games/join-by-code/:gameCode
   */
  joinGameByCode: async (req, res) => {
    try {
      const { gameCode } = req.params;
      const userId = req.user._id;
      
      // Find game by code
      const game = await Game.findOne({ gameCode });
      
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Game not found with that code'
        });
      }
      
      // Check if game is joinable
      if (game.status !== 'waiting') {
        return res.status(400).json({
          success: false,
          message: 'Game has already started or is completed'
        });
      }
      
      // Check if player is already in the game
      const isPlayerInGame = game.players.some(
        player => player.userId.toString() === userId.toString()
      );
      
      if (isPlayerInGame) {
        return res.status(400).json({
          success: false,
          message: 'You are already in this game'
        });
      }
      
      // Check if game is full
      if (game.players.length >= 2) {
        return res.status(400).json({
          success: false,
          message: 'Game is full'
        });
      }
      
      // Add player to game
      game.players.push({
        userId,
        username: req.user.username,
        displayName: req.user.displayName || req.user.username,
        isReady: false
      });
      
      await game.save();
      
      res.status(200).json({
        success: true,
        message: 'Successfully joined the game',
        game: game.getGameSummary()
      });
    } catch (error) {
      console.error('Join game by code error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join the game'
      });
    }
  },
  
  /**
   * Get game by ID
   * @route GET /api/games/:gameId
   */
  getGameById: async (req, res) => {
    try {
      const { gameId } = req.params;
      const userId = req.user._id;
      
      const game = await Game.findById(gameId);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          message: 'Game not found'
        });
      }
      
      // Check if user is part of the game
      const isPlayerInGame = game.players.some(
        player => player.userId.toString() === userId.toString()
      );
      
      if (!isPlayerInGame && game.isPrivate) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this game'
        });
      }
      
      res.status(200).json({
        success: true,
        game: game.getGameSummary()
      });
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve game information'
      });
    }
  },
  
  /**
   * Join matchmaking
   * @route POST /api/games/matchmaking/join
   */
  joinMatchmaking: async (req, res) => {
    // This is handled by WebSockets, not REST API
    res.status(200).json({
      success: true,
      message: 'Matchmaking is handled by WebSockets'
    });
  },
  
  /**
   * Leave matchmaking
   * @route POST /api/games/matchmaking/leave
   */
  leaveMatchmaking: async (req, res) => {
    // This is handled by WebSockets, not REST API
    res.status(200).json({
      success: true,
      message: 'Matchmaking is handled by WebSockets'
    });
  }
};

export default gameController;
