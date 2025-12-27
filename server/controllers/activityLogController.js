import ActivityLog from '../models/ActivityLog.js';

// GET /api/activity-logs
export const getActivityLogs = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch from standalone collection
        const logs = await ActivityLog.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(100); // Consistent with previous limit logic

        res.status(200).json({
            success: true,
            data: logs || []
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};
