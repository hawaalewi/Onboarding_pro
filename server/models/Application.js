import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  jobSeeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true,
  },
  status: {
    type: String,
     enum: ['Pending', 'Shortlisted', 'Selected', 'Rejected'],
    default: 'Pending',
  },
  dateApplied: {
    type: Date,
    default: Date.now,
    index: true,
  },
  organizationName: {
    type: String,
    required: true,
  },

   // ⭐ NEW — Export and Review Fields
  portfolioLinks: [String],
  experienceSummary: String,


  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent duplicate applications
// A job seeker can only apply once per session
applicationSchema.index({ jobSeeker: 1, session: 1 }, { unique: true });

// Index for querying applications by session
applicationSchema.index({ session: 1, status: 1 });

// Index for querying applications by job seeker with status
applicationSchema.index({ jobSeeker: 1, dateApplied: -1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
