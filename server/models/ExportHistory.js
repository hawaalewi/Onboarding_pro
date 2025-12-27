import mongoose from 'mongoose';

const exportHistorySchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
        index: true,
    },
    type: {
        type: String, // 'csv', 'excel', 'zip'
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ExportHistory = mongoose.model('ExportHistory', exportHistorySchema);
export default ExportHistory;
