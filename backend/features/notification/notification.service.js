const Notification = require('./Notification');
const User = require('../user/User');

exports.createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    throw new Error('Error creating notification: ' + error.message);
  }
};

exports.notifyAdmins = async (title, message, type = 'system', relatedData = {}) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    const notifications = await Promise.all(
      admins.map(admin =>
        createNotification({
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
    throw new Error('Error notifying admins: ' + error.message);
  }
};

exports.getUserNotifications = async (userId, limit = 50) => {
  const notifications = await Notification.find({
    recipient: userId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false
  });

  return { notifications, unreadCount };
};

exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) throw new Error('Notification not found');
  if (notification.recipient.toString() !== userId.toString())
    throw new Error('Access denied');

  notification.isRead = true;
  await notification.save();
  return notification;
};

exports.markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  return true;
};
