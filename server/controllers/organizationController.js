import User from '../models/User.js';
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

// Helper function to verify organization account
const verifyOrganization = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.accountType !== 'organization') {
    return { error: 'Access denied. Organization account required.', user: null };
  }
  return { error: null, user };
};

// POST /api/organization - Create/initialize organization
export const createOrganization = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an organization
    const { error, user } = await verifyOrganization(userId);
    if (error) {
      return res.status(403).json({ success: false, message: error });
    }

    // Check if organization already has company info
    if (user.companyInfo?.companyName) {
      return res.status(400).json({
        success: false,
        message: 'Organization already exists. Use update endpoint to modify.'
      });
    }

    const { companyInfo } = req.body;

    if (!companyInfo) {
      return res.status(400).json({
        success: false,
        message: 'Company information is required'
      });
    }

    // Validation errors array
    const errors = [];

    // Validate companyName (required)
    if (!companyInfo.companyName || typeof companyInfo.companyName !== 'string') {
      errors.push('Company name is required and must be a string');
    } else if (companyInfo.companyName.trim().length === 0) {
      errors.push('Company name cannot be empty');
    } else if (companyInfo.companyName.length > 100) {
      errors.push('Company name must be less than 100 characters');
    }

    // Validate industry
    if (companyInfo.industry !== undefined && typeof companyInfo.industry !== 'string') {
      errors.push('Industry must be a string');
    }

    // Validate address
    if (companyInfo.address !== undefined && typeof companyInfo.address !== 'string') {
      errors.push('Address must be a string');
    }

    // Validate logoUrl
    if (companyInfo.logoUrl !== undefined) {
      if (typeof companyInfo.logoUrl !== 'string') {
        errors.push('Logo URL must be a string');
      } else if (companyInfo.logoUrl.trim().length > 0 && !isValidUrl(companyInfo.logoUrl)) {
        errors.push('Logo URL must be a valid URL (http:// or https://)');
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

    // Initialize company info
    if (!user.companyInfo) {
      user.companyInfo = {};
    }

    user.companyInfo.companyName = companyInfo.companyName.trim();
    if (companyInfo.industry !== undefined) {
      user.companyInfo.industry = companyInfo.industry.trim();
    }
    if (companyInfo.address !== undefined) {
      user.companyInfo.address = companyInfo.address.trim();
    }
    if (companyInfo.logoUrl !== undefined) {
      user.companyInfo.logoUrl = companyInfo.logoUrl.trim();
    }

    // Recalculate completion
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    // Log activity
    await logActivity(userId, 'ORG_CREATED', 'organization', userId, { name: companyInfo.companyName });

    // Return created organization (exclude password)
    const updatedUser = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: {
        companyInfo: {
          companyName: updatedUser.companyInfo?.companyName || '',
          industry: updatedUser.companyInfo?.industry || '',
          address: updatedUser.companyInfo?.address || '',
          logoUrl: updatedUser.companyInfo?.logoUrl || ''
        },
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating organization',
      error: error.message
    });
  }
};

// PUT /api/organization - Update organization
export const updateOrganization = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an organization
    const { error, user } = await verifyOrganization(userId);
    if (error) {
      return res.status(403).json({ success: false, message: error });
    }

    // Check if organization is active (handle undefined as true for backward compatibility)
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update closed organization. Please contact support to reactivate.'
      });
    }

    const { companyInfo } = req.body;

    if (!companyInfo) {
      return res.status(400).json({
        success: false,
        message: 'Company information is required'
      });
    }

    // Validation errors array
    const errors = [];

    // Validate companyName (optional for update)
    if (companyInfo.companyName !== undefined) {
      if (typeof companyInfo.companyName !== 'string') {
        errors.push('Company name must be a string');
      } else if (companyInfo.companyName.trim().length === 0) {
        errors.push('Company name cannot be empty');
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

    // Validate logoUrl
    if (companyInfo.logoUrl !== undefined) {
      if (typeof companyInfo.logoUrl !== 'string') {
        errors.push('Logo URL must be a string');
      } else if (companyInfo.logoUrl.trim().length > 0 && !isValidUrl(companyInfo.logoUrl)) {
        errors.push('Logo URL must be a valid URL (http:// or https://)');
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

    // Update company info (only provided fields)
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
    if (companyInfo.logoUrl !== undefined) {
      user.companyInfo.logoUrl = companyInfo.logoUrl.trim();
    }

    // Extended fields
    if (companyInfo.description !== undefined) user.companyInfo.description = companyInfo.description.trim();
    if (companyInfo.website !== undefined) user.companyInfo.website = companyInfo.website.trim();
    if (companyInfo.location !== undefined) user.companyInfo.location = companyInfo.location.trim(); // Map location
    if (companyInfo.contactEmail !== undefined) user.companyInfo.contactEmail = companyInfo.contactEmail.trim();
    if (companyInfo.contactPhone !== undefined) user.companyInfo.contactPhone = companyInfo.contactPhone.trim();

    // Recalculate completion
    const { percent, missingFields } = calculateProfileCompletion(user);
    user.profileCompletion = { percent, missingFields };

    await user.save();

    // Log activity
    await logActivity(userId, 'ORG_UPDATED', 'organization', userId);

    // Return updated organization (exclude password)
    const updatedUser = await User.findById(userId).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: {
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
        },
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating organization',
      error: error.message
    });
  }
};

// PATCH /api/organization/close - Close organization
export const closeOrganization = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an organization
    const { error, user } = await verifyOrganization(userId);
    if (error) {
      return res.status(403).json({ success: false, message: error });
    }

    // Check if organization is already closed (handle undefined as true for backward compatibility)
    if (user.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Organization is already closed'
      });
    }

    // Close the organization (soft delete)
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Organization closed successfully'
    });
  } catch (error) {
    console.error('Error closing organization:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing organization',
      error: error.message
    });
  }
};

// GET /api/organization - Fetch organization profile (logged in)
export const getOrganizationProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an organization
    const { error, user } = await verifyOrganization(userId);
    if (error) {
      return res.status(403).json({ success: false, message: error });
    }

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
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

// GET /api/organization/:id/public
export const getOrganizationPublicProfile = async (req, res) => {
  try {
    const orgId = req.params.id;
    const user = await User.findById(orgId).select('companyInfo email accountType');

    if (!user || user.accountType !== 'organization') {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.companyInfo, // Mongoose subdocument
        email: user.companyInfo?.contactEmail || user.email // Public contact or fallback
      }
    });
  } catch (error) {
    console.error('Error fetching public org profile:', error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

