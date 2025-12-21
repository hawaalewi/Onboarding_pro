import User from '../models/User.js';
import Application from '../models/Application.js';
import Session from '../models/Session.js';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';
import { logActivity } from '../utils/activityLogger.js';

// Helper function to validate URL
const isValidUrl = (string) => {
  if (!string || string.trim() === '') return true; // Allow empty string
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// GET /api/user/profile - Fetch user profile (job seeker or organization)
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return profile data based on account type
    if (user.accountType === 'job_seeker') {
      // Ensure experience is always an array (handle legacy string data)
      let experience = user.personalInfo?.experience || [];
      if (typeof experience === 'string') {
        experience = [];
      }
      if (!Array.isArray(experience)) {
        experience = [];
      }

      res.status(200).json({
        success: true,
        data: {
          email: user.email,
          personalInfo: {
            fullName: user.personalInfo?.fullName || '',
            skills: user.personalInfo?.skills || [],
            experience: experience,
            profilePhotoUrl: user.personalInfo?.profilePhotoUrl || '',
            resumeUrl: user.personalInfo?.resumeUrl || ''
          }
        }
      });
    } else if (user.accountType === 'organization') {
      res.status(200).json({
        success: true,
        data: {
          email: user.email,
          isActive: user.isActive,
          companyInfo: {
            companyName: user.companyInfo?.companyName || '',
            industry: user.companyInfo?.industry || '',
            address: user.companyInfo?.address || '',
            logoUrl: user.companyInfo?.logoUrl || '',
            location: user.companyInfo?.location || '',
            description: user.companyInfo?.description || '',
            website: user.companyInfo?.website || '',
            contactEmail: user.companyInfo?.contactEmail || '',
            contactPhone: user.companyInfo?.contactPhone || '',
            socialLinks: user.companyInfo?.socialLinks || {
              linkedin: '',
              facebook: '',
              twitter: '',
              instagram: '',
              website: ''
            }
          }
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type'
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// PUT /api/user/profile - Update user profile (job seeker or organization)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle job seeker profile update
    if (user.accountType === 'job_seeker') {
      const { fullName, skills, experience, resumeUrl } = req.body;

      // Validation errors array
      const errors = [];

      // Validate fullName
      if (fullName !== undefined) {
        if (typeof fullName !== 'string') {
          errors.push('Full name must be a string');
        } else if (fullName.length > 100) {
          errors.push('Full name must be less than 100 characters');
        }
      }

      // Validate skills (comma-separated string)
      let skillsArray = [];
      if (skills !== undefined) {
        if (typeof skills !== 'string') {
          errors.push('Skills must be a string');
        } else {
          // Trim and filter empty strings
          skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      }

      // Validate resumeUrl
      if (resumeUrl !== undefined) {
        if (typeof resumeUrl !== 'string') {
          errors.push('Resume URL must be a string');
        } else if (!isValidUrl(resumeUrl)) {
          errors.push('Resume URL must be a valid URL (http:// or https://)');
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors
        });
      }

      // Update user profile
      if (!user.personalInfo) {
        user.personalInfo = {};
      }

      if (fullName !== undefined) {
        user.personalInfo.fullName = fullName.trim();
      }
      if (skills !== undefined) {
        user.personalInfo.skills = skillsArray;
      }
      // Experience is now managed via CRUD endpoints, don't update here
      // Ensure experience is always an array if it exists
      if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
        user.personalInfo.experience = [];
      }
      if (resumeUrl !== undefined) {
        user.personalInfo.resumeUrl = resumeUrl.trim();
      }

      // Recalculate profile completion
      const { percent, missingFields } = calculateProfileCompletion(user);
      user.profileCompletion = { percent, missingFields };

      await user.save();

      // Log activity
      await logActivity(userId, 'PROFILE_UPDATE', 'profile', userId, { changes: Object.keys(req.body) });

      // Return updated profile (exclude password)
      const updatedUser = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');

      res.status(200).json({
        success: true,
        data: {
          email: updatedUser.email,
          personalInfo: {
            fullName: updatedUser.personalInfo?.fullName || '',
            emailAddress: updatedUser.personalInfo?.emailAddress || updatedUser.email || '',
            phoneNumber: updatedUser.personalInfo?.phoneNumber || '',
            bio: updatedUser.personalInfo?.bio || '',
            profilePhotoUrl: updatedUser.personalInfo?.profilePhotoUrl || '',
            skills: updatedUser.personalInfo?.skills || [],
            experience: updatedUser.personalInfo?.experience || [],
            resumeUrl: updatedUser.personalInfo?.resumeUrl || ''
          }
        },
        message: 'Profile updated successfully'
      });
    }
    // Handle organization profile update
    else if (user.accountType === 'organization') {
      const { companyInfo } = req.body;

      if (!companyInfo) {
        return res.status(400).json({
          success: false,
          message: 'Company information is required'
        });
      }

      // Validation errors array
      const errors = [];

      // Validate companyName
      if (companyInfo.companyName !== undefined) {
        if (typeof companyInfo.companyName !== 'string') {
          errors.push('Company name must be a string');
        } else if (companyInfo.companyName.length > 100) {
          errors.push('Company name must be less than 100 characters');
        }
      }

      // Validate industry
      if (companyInfo.industry !== undefined && typeof companyInfo.industry !== 'string') {
        errors.push('Industry must be a string');
      }

      // Validate address
      if (companyInfo.address !== undefined && typeof companyInfo.address !== 'string') {
        errors.push('Address must be a string');
      }

      // Return validation errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors
        });
      }

      // Update company info
      if (!user.companyInfo) {
        user.companyInfo = {};
      }

      if (companyInfo.companyName !== undefined) {
        user.companyInfo.companyName = companyInfo.companyName.trim();
      }
      if (companyInfo.industry !== undefined) {
        user.companyInfo.industry = companyInfo.industry.trim();
      }
      if (companyInfo.address !== undefined) {
        user.companyInfo.address = companyInfo.address.trim();
      }
      if (companyInfo.location !== undefined) {
        user.companyInfo.location = companyInfo.location.trim();
      }
      if (companyInfo.description !== undefined) {
        user.companyInfo.description = companyInfo.description.trim();
      }
      if (companyInfo.website !== undefined) {
        user.companyInfo.website = companyInfo.website.trim();
      }
      if (companyInfo.contactEmail !== undefined) {
        user.companyInfo.contactEmail = companyInfo.contactEmail.trim();
      }
      if (companyInfo.contactPhone !== undefined) {
        user.companyInfo.contactPhone = companyInfo.contactPhone.trim();
      }
      if (companyInfo.socialLinks !== undefined) {
        user.companyInfo.socialLinks = {
          ...user.companyInfo.socialLinks,
          ...companyInfo.socialLinks
        };
      }

      // Recalculate profile completion
      const { percent, missingFields } = calculateProfileCompletion(user);
      user.profileCompletion = { percent, missingFields };

      await user.save();

      // Return updated profile
      const updatedUser = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');

      res.status(200).json({
        success: true,
        data: {
          email: updatedUser.email,
          isActive: updatedUser.isActive,
          companyInfo: {
            companyName: updatedUser.companyInfo?.companyName || '',
            industry: updatedUser.companyInfo?.industry || '',
            address: updatedUser.companyInfo?.address || '',
            logoUrl: updatedUser.companyInfo?.logoUrl || '',
            location: updatedUser.companyInfo?.location || '',
            description: updatedUser.companyInfo?.description || '',
            website: updatedUser.companyInfo?.website || '',
            contactEmail: updatedUser.companyInfo?.contactEmail || '',
            contactPhone: updatedUser.companyInfo?.contactPhone || '',
            socialLinks: updatedUser.companyInfo?.socialLinks || {}
          }
        },
        message: 'Profile updated successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type'
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// GET /api/user/profile/details - Fetch full profile with metrics
export const getProfileDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a job seeker
    const user = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Get metrics
    const applicationsCount = await Application.countDocuments({ jobSeeker: userId });
    const approvedApplications = await Application.find({
      jobSeeker: userId,
      status: 'Approved'
    }).select('session');
    const sessionIds = approvedApplications.map(app => app.session);
    const sessionsCount = await Session.countDocuments({
      _id: { $in: sessionIds },
      date: { $gte: new Date() },
      status: 'Active'
    });

    // Ensure experience is always an array (handle legacy string data)
    let experience = user.personalInfo?.experience || [];
    if (typeof experience === 'string') {
      experience = [];
    }
    if (!Array.isArray(experience)) {
      experience = [];
    }

    // Ensure skills is always an array
    let skills = user.personalInfo?.skills || [];
    if (!Array.isArray(skills)) {
      skills = [];
    }

    // Return full profile data
    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        personalInfo: {
          fullName: user.personalInfo?.fullName || '',
          emailAddress: user.personalInfo?.emailAddress || user.email || '',
          phoneNumber: user.personalInfo?.phoneNumber || '',
          bio: user.personalInfo?.bio || '',
          profilePhotoUrl: user.personalInfo?.profilePhotoUrl || '',
          skills: skills,
          experience: experience,
          resumeUrl: user.personalInfo?.resumeUrl || ''
        },
        metrics: {
          applicationsCount,
          sessionsCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile details',
      error: error.message
    });
  }
};

// POST /api/user/profile/save - Save profile (update personal info)
export const saveProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, emailAddress, phoneNumber, bio, profilePhotoUrl } = req.body;

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Validation errors array
    const errors = [];

    // Validate fullName
    if (fullName !== undefined) {
      if (typeof fullName !== 'string') {
        errors.push('Full name must be a string');
      } else if (fullName.trim().length > 100) {
        errors.push('Full name must be less than 100 characters');
      }
    }

    // Validate emailAddress
    if (emailAddress !== undefined) {
      if (typeof emailAddress !== 'string') {
        errors.push('Email address must be a string');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailAddress.trim().length > 0 && !emailRegex.test(emailAddress.trim())) {
          errors.push('Email address must be a valid email format');
        }
      }
    }

    // Validate phoneNumber
    if (phoneNumber !== undefined) {
      if (typeof phoneNumber !== 'string') {
        errors.push('Phone number must be a string');
      }
      // Optional: Add phone validation regex if needed
    }

    // Validate bio
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        errors.push('Bio must be a string');
      } else if (bio.length > 500) {
        errors.push('Bio must be less than 500 characters');
      }
    }

    // Validate profilePhotoUrl
    if (profilePhotoUrl !== undefined) {
      if (typeof profilePhotoUrl !== 'string') {
        errors.push('Profile photo URL must be a string');
      } else if (profilePhotoUrl.trim().length > 0 && !isValidUrl(profilePhotoUrl)) {
        errors.push('Profile photo URL must be a valid URL (http:// or https://)');
      }
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    // Update user profile (only changed fields)
    if (!user.personalInfo) {
      user.personalInfo = {};
    }

    // Ensure experience and skills are always arrays (handle legacy data)
    if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
      user.personalInfo.experience = [];
    }
    if (!user.personalInfo.skills || !Array.isArray(user.personalInfo.skills)) {
      user.personalInfo.skills = [];
    }

    if (fullName !== undefined) {
      user.personalInfo.fullName = fullName.trim();
    }
    if (emailAddress !== undefined) {
      user.personalInfo.emailAddress = emailAddress.trim();
    }
    if (phoneNumber !== undefined) {
      user.personalInfo.phoneNumber = phoneNumber.trim();
    }
    if (bio !== undefined) {
      user.personalInfo.bio = bio.trim();
    }
    if (profilePhotoUrl !== undefined) {
      user.personalInfo.profilePhotoUrl = profilePhotoUrl.trim();
    }

    // Recalculate profile completion
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    // Log activity
    await logActivity(userId, 'PROFILE_SAVE', 'profile', userId);

    // Return updated profile (exclude password)
    const updatedUser = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
      success: true,
      data: {
        email: updatedUser.email,
        personalInfo: {
          fullName: updatedUser.personalInfo?.fullName || '',
          emailAddress: updatedUser.personalInfo?.emailAddress || updatedUser.email || '',
          phoneNumber: updatedUser.personalInfo?.phoneNumber || '',
          bio: updatedUser.personalInfo?.bio || '',
          profilePhotoUrl: updatedUser.personalInfo?.profilePhotoUrl || '',
          skills: updatedUser.personalInfo?.skills || [],
          experience: updatedUser.personalInfo?.experience || [],
          resumeUrl: updatedUser.personalInfo?.resumeUrl || ''
        }
      },
      message: 'Profile saved successfully'
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving profile',
      error: error.message
    });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpire');

    if (!user || user.accountType !== 'job_seeker') {
      return res.status(404).json({ success: false, message: 'Job seeker not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.personalInfo?.fullName || '',
        about: user.personalInfo?.bio || '',
        profilePhotoUrl: user.personalInfo?.profilePhotoUrl || '',
        skills: user.personalInfo?.skills || [],
        experience: user.personalInfo?.experience || [],
        portfolio: user.personalInfo?.socialLinks?.portfolio || '',
        email: user.email,
        phone: user.personalInfo?.phoneNumber || ''
      }
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching public profile' });
  }
};


