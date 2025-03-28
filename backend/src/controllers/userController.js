import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * User controller methods
 */
const userController = {
  /**
   * Get user's profile
   * @route GET /api/users/profile
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      
      // Get user with populated friends
      const user = await User.findById(userId).populate('friends', 'username displayName avatarUrl isOnline lastActive');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        user: user.getPublicProfile()
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile'
      });
    }
  },
  
  /**
   * Update user's profile
   * @route PUT /api/users/profile
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;
      const { displayName, avatarUrl } = req.body;
      
      // Only allow updating specific fields
      const updateData = {};
      if (displayName) updateData.displayName = displayName;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      
      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true } // Return the updated document
      );
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: user.getPublicProfile()
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },
  
  /**
   * Get user's stats
   * @route GET /api/users/stats
   */
  getStats: async (req, res) => {
    try {
      const userId = req.user._id;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        stats: user.stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user stats'
      });
    }
  },
  
  /**
   * Get user's friends list
   * @route GET /api/users/friends
   */
  getFriends: async (req, res) => {
    try {
      const userId = req.user._id;
      
      const user = await User.findById(userId).populate('friends', 'username displayName avatarUrl isOnline lastActive');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Get public profile for each friend
      const friendsData = user.friends.map(friend => ({
        id: friend._id,
        username: friend.username,
        displayName: friend.displayName || friend.username,
        avatarUrl: friend.avatarUrl,
        isOnline: friend.isOnline,
        lastActive: friend.lastActive
      }));
      
      res.status(200).json({
        success: true,
        friends: friendsData
      });
    } catch (error) {
      console.error('Get friends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve friends list'
      });
    }
  },
  
  /**
   * Add a friend
   * @route POST /api/users/friends/add/:userId
   */
  addFriend: async (req, res) => {
    try {
      const currentUserId = req.user._id;
      const friendId = req.params.userId;
      
      // Check if the IDs are the same
      if (currentUserId.toString() === friendId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }
      
      // Check if friend exists
      const friend = await User.findById(friendId);
      
      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if already friends
      const user = await User.findById(currentUserId);
      
      if (user.friends.includes(friendId)) {
        return res.status(400).json({
          success: false,
          message: 'User is already in your friends list'
        });
      }
      
      // Add friend to user's friends list
      user.friends.push(friendId);
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Friend added successfully',
        friendId: friendId
      });
    } catch (error) {
      console.error('Add friend error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add friend'
      });
    }
  },
  
  /**
   * Remove a friend
   * @route DELETE /api/users/friends/remove/:userId
   */
  removeFriend: async (req, res) => {
    try {
      const currentUserId = req.user._id;
      const friendId = req.params.userId;
      
      // Get current user
      const user = await User.findById(currentUserId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if friend exists in user's friends list
      const friendIndex = user.friends.findIndex(
        id => id.toString() === friendId
      );
      
      if (friendIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Friend not found in your friends list'
        });
      }
      
      // Remove friend from list
      user.friends.splice(friendIndex, 1);
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Friend removed successfully'
      });
    } catch (error) {
      console.error('Remove friend error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove friend'
      });
    }
  }
};

export default userController;
