import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Session timing
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  // Organization reference
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Session status
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled', 'Closed'],
    default: 'Active',
  },
  // Capacity management
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 50,
  },
  currentApplications: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Privacy and visibility
  isPrivate: {
    type: Boolean,
    default: false,
    index: true,
  },
  // Location (can be virtual or physical)
  location: {
    type: String,
    trim: true,
    default: '',
  },
  // Tags for filtering and categorization
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  // Legacy field for backward compatibility (deprecated, use startDate)
  date: {
    type: Date,
  },
  // Legacy field - kept for backward compatibility
  approvedApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
  }],

  // ⭐ NEW — Applicant Status Counts
  applicantStats: {
    pending: { type: Number, default: 0 },
    shortlisted: { type: Number, default: 0 },
    selected: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 }
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
// Discovery queries: filter by date range and status
sessionSchema.index({ startDate: 1, status: 1 });

// Organization's sessions list
sessionSchema.index({ organization: 1, createdAt: -1 });

// Public discovery (exclude private sessions)
sessionSchema.index({ isPrivate: 1, startDate: 1, status: 1 });

// Text search on title and description
sessionSchema.index({ title: 'text', description: 'text' });

// Tags filtering
sessionSchema.index({ tags: 1 });

// Registration deadline queries (for open sessions)
sessionSchema.index({ registrationDeadline: 1, status: 1 });

// Update updatedAt on save
sessionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual: check if session is open for registration
sessionSchema.virtual('isOpen').get(function () {
  const now = new Date();
  return (
    this.status === 'Active' &&
    this.registrationDeadline > now &&
    this.currentApplications < this.capacity
  );
});

// Ensure virtuals are included in JSON
sessionSchema.set('toJSON', { virtuals: true });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
