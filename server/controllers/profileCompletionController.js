// server/controllers/profileCompletionController.js
import User from '../models/User.js';

// GET /api/users/me/profile-completion
export const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'profileCompletion personalInfo companyInfo accountType email'
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Use shared utility for calculation
    const { calculateProfileCompletion } = await import('../utils/profileCompletion.js');
    const { percent, missingFields } = calculateProfileCompletion(user);

    // Update user document (safe extension)
    user.profileCompletion = { percent, missingFields };
    await user.save();

    res.status(200).json({
      success: true,
      data: user.profileCompletion,
    });
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile completion',
      error: error.message,
    });
  }
};
