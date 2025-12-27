import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * Logs an activity to the standalone ActivityLog collection.
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Action name (e.g., 'PROFILE_UPDATE', 'APPLICATION_SUBMIT')
 * @param {string} targetType - Type of target entity (e.g., 'profile', 'application')
 * @param {string} targetId - ID of the target entity
 * @param {object} meta - Additional metadata
 */
export const logActivity = async (userId, action, targetType, targetId, meta = {}) => {
    try {
        // We still fetch user to get the role for the log, 
        // ensuring the log is self-contained for distributed identity.
        const user = await User.findById(userId);
        if (!user) return;

        const logEntry = new ActivityLog({
            user: userId,
            action,
            actorRole: user.accountType,
            targetType,
            targetId,
            meta,
        });

        await logEntry.save();
    } catch (error) {
        console.error('Error logging activity:', error);
        // Silent fail to not disrupt main flow
    }
};
