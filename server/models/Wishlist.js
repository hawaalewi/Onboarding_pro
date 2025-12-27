import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index to prevent duplicate wishlist entries
// A job seeker can only save a session once
wishlistSchema.index({ jobSeeker: 1, session: 1 }, { unique: true });

// Index for querying wishlist by job seeker
wishlistSchema.index({ jobSeeker: 1, createdAt: -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;

