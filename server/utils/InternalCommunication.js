// utils/InternalCommunication.js
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Session from '../models/Session.js';
import Application from '../models/Application.js';

// Fetch user info (helper)
export const getUserInfo = async (userId) => {
    return await User.findById(userId).select('-password');
};

// Fetch organization details (helper)
export const getOrganizationDetails = async (orgId) => {
    return await User.findById(orgId).select('companyInfo email');
};

/**
 * Get metrics for a job seeker (applications count, sessions attending).
 */
export const getJobSeekerMetrics = async (userId) => {
    try {
        const applicationsCount = await Application.countDocuments({ jobSeeker: userId });
        const sessionsCount = await Application.countDocuments({
            jobSeeker: userId,
            status: 'Approved'
        });

        return { applicationsCount, sessionsCount };
    } catch (error) {
        console.error('Error fetching job seeker metrics:', error);
        return { applicationsCount: 0, sessionsCount: 0 };
    }
};

// Fetch active job seekers (helper)
export const getActiveJobSeekers = async () => {
    return await User.find({ accountType: 'job_seeker', isActive: true });
};

// Notify user (helper)
import { getIO } from '../config/socket.js';

export const notifyUser = async ({ userId, type, title, message }) => {
    try {
        const notification = new Notification({
            user: userId,
            type,
            title,
            message
        });
        await notification.save();

        // Emit real-time event
        try {
            const io = getIO();
            io.to(userId.toString()).emit('notification', notification);
        } catch (socketError) {
            console.error('Socket emission failed:', socketError.message);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

/**
 * Fetch all sessions owned by this organization.
 */
export const getOrganizationSessions = async (organizationId) => {
    return await Session.find({ organization: organizationId })
        .select('_id title startDate');
};

/**
 * Fetch session details from the Session service domain.
 */
export const getSessionDetails = async (sessionId) => {
    return await Session.findById(sessionId);
};

/**
 * Update session statistics (e.g., capacity, applicant counts).
 */
export const updateSessionStats = async (sessionId, updateQuery) => {
    return await Session.findByIdAndUpdate(sessionId, updateQuery, { new: true });
};

/**
 * Emit a domain event.
 * Currently simulates an event bus by triggering local side effects.
 */
export const emitEvent = async (eventName, payload) => {
    console.log(`[Event Bus] Emitting event: ${eventName}`, payload);
};

/**
 * Proxy to check for upcoming sessions in the Session service domain.
 */
export const checkUpcomingSessions = async (userId) => {
    try {
        const user = await User.findById(userId).select('accountType');
        if (!user) return;

        let sessionIds = [];
        if (user.accountType === 'job_seeker') {
            const approvedApplications = await Application.find({
                jobSeeker: userId,
                status: 'Approved'
            }).select('session');
            sessionIds = approvedApplications.map(app => app.session);
        } else if (user.accountType === 'organization') {
            const sessions = await Session.find({ organization: userId }).select('_id');
            sessionIds = sessions.map(s => s._id);
        }

        if (sessionIds.length === 0) return;

        const now = new Date();
        const in30Minutes = new Date(now.getTime() + 30 * 60000);

        const upcomingSessions = await Session.find({
            _id: { $in: sessionIds },
            startDate: { $gt: now, $lte: in30Minutes },
            status: 'Active'
        });

        for (const session of upcomingSessions) {
            const reminderTitle = 'Upcoming Session Reminder';
            const reminderMessage = `Your session "${session.title}" starts soon at ${new Date(session.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`;

            const existingNotification = await Notification.findOne({
                user: userId,
                type: 'reminder',
                title: reminderTitle,
                message: reminderMessage
            });

            if (!existingNotification) {
                await notifyUser({
                    userId,
                    type: 'reminder',
                    title: reminderTitle,
                    message: reminderMessage
                });
            }
        }
    } catch (error) {
        console.error('Error checking upcoming sessions:', error);
    }
};
