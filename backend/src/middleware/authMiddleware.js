import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = {
  // Verify JWT token middleware
  verifyToken: async (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Access denied. No token provided or invalid format.' 
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. User not found.' 
        });
      }
      
      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired.' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
  },
  
  // Optional token verification
  optionalAuth: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token, but continue without authentication
        return next();
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
      
      next();
    } catch (error) {
      // Invalid token, but continue without authentication
      next();
    }
  }
};

export default authMiddleware;
