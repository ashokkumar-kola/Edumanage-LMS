const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['assignment', 'assignment_due', 'grade', 'enrollment', 'payment', 'system', 'reminder', 'announcement', 'doc_verified', 'doc_rejected', 'course_approved', 'course_rejected', 'user_approved'],
    required: [true, 'Type is required']
  },
  // Target information for navigation
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  targetUrl: {
    type: String,
    required: false,
    maxlength: [200, 'Target URL cannot exceed 200 characters']
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ isRead: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = new this(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to notify all admins
notificationSchema.statics.notifyAdmins = async function(title, message, type = 'system', relatedData = {}) {
  try {
    const User = require('../user/User');
    const admins = await User.find({ role: 'admin', isActive: true });
    
    const notifications = await Promise.all(
      admins.map(admin => 
        this.createNotification({
          recipient: admin._id,
          title,
          message,
          type,
          ...relatedData
        })
      )
    );
    
    return notifications;
  } catch (error) {
    console.error('Error notifying admins:', error);
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);


const express = require('express');
const Notification = require('./notification.model');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user._id,
      isDeleted: false 
    })
    .sort({ createdAt: -1 })
    .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      isDeleted: false
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
});

module.exports = router;
