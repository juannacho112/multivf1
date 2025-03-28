import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generate tokens for authentication
 * @param {Object} user - User document from database
 * @returns {Object} Object containing access token and refresh token
 */
const generateTokens = (user) => {
  // Create access token
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Access token expires in 1 hour
  );
  
  // Create refresh token
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Refresh token expires in 7 days
  );
  
  return { accessToken, refreshToken };
};

/**
 * Authentication controller methods
 */
const authController = {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]});
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already in use'
        });
      }
      
      // Create new user
      const user = new User({
        username,
        email,
        password,
        displayName: username
      });
      
      await user.save();
      
      // Generate tokens
      const tokens = generateTokens(user);
      
      // Return user data and token
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: user.getPublicProfile(),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during registration'
      });
    }
  },
  
  /**
   * Login an existing user
   * @route POST /api/auth/login
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      // Find user by username
      const user = await User.findOne({ username });
      
      // If user not found or password doesn't match
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }
      
      // Update user's online status
      user.isOnline = true;
      user.lastActive = new Date();
      await user.save();
      
      // Generate tokens
      const tokens = generateTokens(user);
      
      // Return user data and token
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: user.getPublicProfile(),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during login'
      });
    }
  },
  
  /**
   * Refresh access token using refresh token
   * @route POST /api/auth/refresh-token
   */
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Generate new tokens
      const tokens = generateTokens(user);
      
      res.status(200).json({
        success: true,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  },
  
  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  logout: async (req, res) => {
    try {
      // In a more sophisticated system, we would blacklist the token here
      
      // If user is authenticated, update online status
      if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          isOnline: false,
          lastActive: new Date()
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during logout'
      });
    }
  }
};

export default authController;
