import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    action: {
        type: String,
        required: true,
    },
    targetType: {
        type: String, // 'profile', 'session', 'application', etc.
        required: true,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    actorRole: {
        type: String,
        enum: ['job_seeker', 'organization', 'system'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
