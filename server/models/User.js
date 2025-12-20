import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  accountType: {
    type: String,
    enum: ['job_seeker', 'organization'],
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  // -------------------------
  // Personal info for Job Seeker
  // -------------------------
  personalInfo: {
    fullName: String,
    emailAddress: String,
    phoneNumber: String,
    bio: String,
    profilePhotoUrl: String,

    skills: [String],

    experience: {
      type: [
        {
          company: String,
          startDate: Date,
          endDate: Date,
          description: String,
          isCurrent: { type: Boolean, default: false }
        }
      ],
      default: []
    },

    resumeUrl: { type: String, default: "" },

    // ⭐ NEW — Social / Portfolio Links
    socialLinks: {
      website: String,
      github: String,
      linkedin: String,
      portfolio: String,
      otherLinks: [String]
    },

    // ⭐ NEW — Education Section
    education: {
      type: [
        {
          school: String,
          degree: String,
          startDate: Date,
          endDate: Date,
          stillStudying: { type: Boolean, default: false },
          description: String
        }
      ],
      default: []
    },
  },

  // ⭐ NEW — Profile Completion
  profileCompletion: {
    percent: { type: Number, default: 0 },
    missingFields: { type: [String], default: [] }
  },

  // -------------------------
  // Organization info
  // -------------------------
  companyInfo: {
    companyName: String,
    industry: String,
    address: String,
    logoUrl: String,

    // ⭐ NEW — Organization Profile Extensions
    location: String,
    description: String,
    website: String,
    contactEmail: String,
    contactPhone: String,

    socialLinks: {
      linkedin: String,
      facebook: String,
      twitter: String,
      instagram: String,
      website: String
    }
  },

  // ⭐ NEW — Embedded Notifications
  notifications: {
    type: [
      {
        type: { type: String }, // application, status_changed, session_update
        title: String,
        message: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  },

  // ⭐ NEW — Activity Logs (Lightweight)
  activityLogs: {
    type: [
      {
        action: String,            // e.g. SESSION_CREATED
        actorRole: String,         // job_seeker | organization
        targetType: String,        // session | application | profile
        targetId: mongoose.Schema.Types.ObjectId,
        meta: Object,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  },

  // -------------------------
  // System Fields
  // -------------------------

  resetPasswordToken: String,
  resetPasswordExpire: Date,

  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
export default User;
