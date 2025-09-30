const express = require('express');
const { auth } = require('../../middleware/authMiddleware');
const validateRequest = require('../../middleware/validateRequest');
const NotificationController = require('./notification.controller');
const {
  createNotificationValidation,
  notificationIdValidation
} = require('./notification.validation');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, NotificationController.getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/:id/read',
  auth,
  notificationIdValidation,
  validateRequest,
  NotificationController.markAsRead
);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, NotificationController.markAllAsRead);

module.exports = router;
