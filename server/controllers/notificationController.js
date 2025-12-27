import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { checkUpcomingSessions } from '../utils/InternalCommunication.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trigger upcoming session check before fetching notifications
    await checkUpcomingSessions(userId);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build query
    let query = { user: userId };
    if (unreadOnly) {
      query.read = false;
    }

    // Get total count (for pagination)
    const total = await Notification.countDocuments(query);

    // Get unread count (always needed for badge)
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Format response
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        total,
        unreadCount,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
  }
};

// PATCH /api/notifications/mark-all-read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Error updating notifications', error: error.message });
  }
};

// Internal utility to create notification
export const createNotification = async ({ userId, type, title, message }) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw, just log - notifications shouldn't break main flow
    return null;
  }
};





