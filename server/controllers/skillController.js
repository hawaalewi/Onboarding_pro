import User from '../models/User.js';

// POST /api/user/skills - Add a new skill
export const addSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill } = req.body;

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Validation
    if (!skill || typeof skill !== 'string' || skill.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required and must be a non-empty string'
      });
    }

    const trimmedSkill = skill.trim();
    if (trimmedSkill.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Skill name must be less than 50 characters'
      });
    }

    // Initialize personalInfo and ensure experience is always an array
    if (!user.personalInfo) {
      user.personalInfo = { skills: [], experience: [] };
    }
    if (!user.personalInfo.skills || !Array.isArray(user.personalInfo.skills)) {
      user.personalInfo.skills = [];
    }
    // Ensure experience is always an array (handle legacy string data)
    if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
      user.personalInfo.experience = [];
    }

    if (user.personalInfo.skills.includes(trimmedSkill)) {
      return res.status(400).json({
        success: false,
        message: 'Skill already exists'
      });
    }

    // Add skill
    user.personalInfo.skills.push(trimmedSkill);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        skills: user.personalInfo.skills
      },
      message: 'Skill added successfully'
    });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding skill',
      error: error.message
    });
  }
};

// PUT /api/user/skills/:id - Update a skill
export const updateSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // This is the index or skill name
    const { skill } = req.body;

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Validation
    if (!skill || typeof skill !== 'string' || skill.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required and must be a non-empty string'
      });
    }

    const trimmedSkill = skill.trim();
    if (trimmedSkill.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Skill name must be less than 50 characters'
      });
    }

    if (!user.personalInfo || !user.personalInfo.skills) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Find skill by index or by name
    const skillIndex = parseInt(id);
    if (isNaN(skillIndex) || skillIndex < 0 || skillIndex >= user.personalInfo.skills.length) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Check if new skill name already exists (excluding current skill)
    if (user.personalInfo.skills.some((s, idx) => s === trimmedSkill && idx !== skillIndex)) {
      return res.status(400).json({
        success: false,
        message: 'Skill name already exists'
      });
    }

    // Update skill
    user.personalInfo.skills[skillIndex] = trimmedSkill;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        skills: user.personalInfo.skills
      },
      message: 'Skill updated successfully'
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating skill',
      error: error.message
    });
  }
};

// DELETE /api/user/skills/:id - Delete a skill
export const deleteSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // This is the index

    // Verify user is a job seeker
    const user = await User.findById(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Job seeker account required.'
      });
    }

    // Initialize personalInfo if needed
    if (!user.personalInfo) {
      user.personalInfo = { skills: [], experience: [] };
    }
    if (!user.personalInfo.skills || !Array.isArray(user.personalInfo.skills)) {
      user.personalInfo.skills = [];
    }
    // Ensure experience is always an array
    if (!user.personalInfo.experience || typeof user.personalInfo.experience === 'string') {
      user.personalInfo.experience = [];
    }

    const skillIndex = parseInt(id);
    if (isNaN(skillIndex) || skillIndex < 0 || skillIndex >= user.personalInfo.skills.length) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Delete skill
    user.personalInfo.skills.splice(skillIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        skills: user.personalInfo.skills
      },
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting skill',
      error: error.message
    });
  }
};

