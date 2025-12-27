import Wishlist from '../models/Wishlist.js';
import { getUserInfo, getSessionDetails } from '../utils/InternalCommunication.js';

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a job seeker via InternalCommunication
    const user = await getUserInfo(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied. Job seeker account required.' });
    }

    // Get wishlist items (Remove cross-domain populate)
    const wishlistItems = await Wishlist.find({ jobSeeker: userId })
      .sort({ createdAt: -1 });

    // Format response with manual stitching
    const validItems = (await Promise.all(wishlistItems.map(async (item) => {
      const session = await getSessionDetails(item.session);
      if (!session) return null;

      const organization = await getUserInfo(session.organization);

      const itemObj = item.toObject();
      itemObj.session = {
        ...session.toObject(),
        organization: {
          companyInfo: {
            companyName: organization?.companyInfo?.companyName || 'Organization',
            logoUrl: organization?.companyInfo?.logoUrl || ''
          }
        }
      };
      return itemObj;
    }))).filter(item => item !== null);

    res.status(200).json({
      success: true,
      data: validItems
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

// Add session to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    // Verify user is a job seeker via InternalCommunication
    const user = await getUserInfo(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied. Job seeker account required.' });
    }

    // Validate sessionId
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Check if session exists via InternalCommunication
    const session = await getSessionDetails(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if already in wishlist
    const existingWishlist = await Wishlist.findOne({
      jobSeeker: userId,
      session: sessionId
    });

    if (existingWishlist) {
      return res.status(400).json({
        message: 'Session is already in your wishlist.',
        data: existingWishlist
      });
    }

    // Create wishlist item
    const wishlistItem = new Wishlist({
      jobSeeker: userId,
      session: sessionId
    });

    await wishlistItem.save();

    // Stitch session and organization for response
    const org = await getUserInfo(session.organization);
    const result = wishlistItem.toObject();
    result.session = {
      ...session.toObject(),
      organization: {
        companyInfo: {
          companyName: org?.companyInfo?.companyName || 'Organization',
          logoUrl: org?.companyInfo?.logoUrl || ''
        }
      }
    };

    res.status(201).json({
      success: true,
      message: 'Session added to wishlist successfully',
      data: result
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Session is already in your wishlist.' });
    }

    res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
  }
};

// Remove session from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    // Verify user is a job seeker via InternalCommunication
    const user = await getUserInfo(userId);
    if (!user || user.accountType !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied. Job seeker account required.' });
    }

    // Find and delete wishlist item
    const wishlistItem = await Wishlist.findOneAndDelete({
      jobSeeker: userId,
      session: sessionId
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Session not found in wishlist' });
    }

    res.status(200).json({
      success: true,
      message: 'Session removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
  }
};

