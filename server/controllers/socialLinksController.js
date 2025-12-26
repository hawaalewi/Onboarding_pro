import User from '../models/User.js';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';

// Helper to validate URLs
const isValidUrl = (url) => {
  if (!url || url.trim() === '') return true; // allow empty
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

// GET /api/users/me/social-links
export const getSocialLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('personalInfo');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      data: user.personalInfo?.socialLinks || {
        website: '',
        github: '',
        linkedin: '',
        portfolio: '',
        otherLinks: []
      }
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    res.status(500).json({ success: false, message: 'Error fetching social links', error: error.message });
  }
};

// PUT /api/users/me/social-links
export const updateSocialLinks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { website, github, linkedin, portfolio, otherLinks } = req.body;

    const errors = [];

    if (!isValidUrl(website)) errors.push('Website URL must be valid.');
    if (!isValidUrl(github)) errors.push('GitHub URL must be valid.');
    if (!isValidUrl(linkedin)) errors.push('LinkedIn URL must be valid.');
    if (!isValidUrl(portfolio)) errors.push('Portfolio URL must be valid.');
    if (otherLinks && !Array.isArray(otherLinks)) errors.push('Other links must be an array of URLs.');
    if (otherLinks && Array.isArray(otherLinks)) {
      for (const link of otherLinks) {
        if (!isValidUrl(link)) errors.push(`Invalid URL in otherLinks: ${link}`);
      }
    }

    if (errors.length > 0) return res.status(400).json({ success: false, message: 'Validation errors', errors });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.personalInfo) user.personalInfo = {};

    user.personalInfo.socialLinks = {
      website: website?.trim() || '',
      github: github?.trim() || '',
      linkedin: linkedin?.trim() || '',
      portfolio: portfolio?.trim() || '',
      otherLinks: Array.isArray(otherLinks) ? otherLinks.map(l => l.trim()) : []
    };

    // Trigger profile completion recalculation
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    res.status(200).json({ success: true, message: 'Social links updated successfully', data: user.personalInfo.socialLinks });
  } catch (error) {
    console.error('Error updating social links:', error);
    res.status(500).json({ success: false, message: 'Error updating social links', error: error.message });
  }
};
