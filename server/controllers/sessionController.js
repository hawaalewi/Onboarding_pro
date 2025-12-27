import Session from '../models/Session.js';
import Application from '../models/Application.js';
import Wishlist from '../models/Wishlist.js';
import { notifyUser, getUserInfo, getActiveJobSeekers, getOrganizationDetails } from '../utils/InternalCommunication.js';

export const getJobSeekerCalendar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all approved applications for this job seeker
    const approvedApplications = await Application.find({
      jobSeeker: userId,
      status: 'Approved',
    }).select('session');

    const sessionIds = approvedApplications.map(app => app.session);

    // Build query for sessions
    let query = Session.find({
      _id: { $in: sessionIds },
      date: { $gte: new Date() }, // Only future sessions
      status: 'Active',
    });

    // Handle sort parameter
    const sortParam = req.query.sort;
    if (sortParam) {
      if (sortParam === 'date') {
        query = query.sort({ date: 1 }); // Ascending (earliest first)
      } else if (sortParam === '-date') {
        query = query.sort({ date: -1 }); // Descending (latest first)
      }
    } else {
      // Default sort by date ascending (upcoming first)
      query = query.sort({ date: 1 });
    }

    // Execute query
    let sessions = await query.exec();

    // Handle limit parameter
    const limit = parseInt(req.query.limit);
    if (limit && limit > 0) {
      sessions = sessions.slice(0, limit);
    }

    // Format response to match frontend expectations
    const formattedSessions = sessions.map(session => ({
      title: session.title,
      date: session.date,
      description: session.description,
    }));

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error('Error fetching job seeker calendar:', error);
    res.status(500).json({ message: 'Error fetching calendar', error: error.message });
  }
};

// Organization Session Management
export const getOrganizationSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Build query for organization's sessions
    let query = Session.find({ organization: userId });

    // Handle sort parameter
    const sortParam = req.query.sort;
    if (sortParam) {
      if (sortParam === '-createdAt') {
        query = query.sort({ createdAt: -1 });
      } else if (sortParam === 'createdAt') {
        query = query.sort({ createdAt: 1 });
      } else if (sortParam === 'startDate') {
        query = query.sort({ startDate: 1 });
      } else if (sortParam === '-startDate') {
        query = query.sort({ startDate: -1 });
      }
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // Execute query
    let sessions = await query.exec();

    // Handle limit parameter
    const limit = parseInt(req.query.limit);
    if (limit && limit > 0) {
      sessions = sessions.slice(0, limit);
    }

    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching organization sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await getUserInfo(userId);
    // Check if organization is active (handle undefined as true for backward compatibility)
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Access denied. Organization account is closed.' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      registrationDeadline,
      capacity,
      location,
      tags,
      isPrivate,
      status
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate || !registrationDeadline) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse tags if it's a string
    let tagsArray = [];
    if (tags) {
      tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) : tags;
    }

    const newSession = new Session({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      capacity: capacity || 50,
      location: location || '',
      tags: tagsArray,
      isPrivate: isPrivate || false,
      status: status || 'Active',
      organization: userId,
      date: new Date(startDate), // Legacy field for backward compatibility
      currentApplications: 0
    });

    await newSession.save();

    // Notify all job seekers asynchronously (fire & forget)
    // In a distributed system, this would be an event emitted to a Message Bus
    (async () => {
      try {
        // Fetch all active job seekers via InternalCommunication
        const jobSeekers = await getActiveJobSeekers();

        // Create notifications for each
        const notifications = jobSeekers.map(jobSeeker => {
          return notifyUser({
            userId: jobSeeker._id,
            type: 'session_update',
            title: 'New Job Opportunity',
            message: `${user.companyInfo?.companyName || 'An organization'} posted a new opportunity: ${title}`
          });
        });

        await Promise.all(notifications);
        console.log(`Sent new session notifications to ${jobSeekers.length} job seekers.`);
      } catch (notifyError) {
        console.error('Error sending session notifications:', notifyError);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: newSession
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // Find session and verify ownership
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.organization.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own sessions.' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      registrationDeadline,
      capacity,
      location,
      tags,
      isPrivate,
      status
    } = req.body;

    // Update fields
    if (title) session.title = title;
    if (description) session.description = description;
    if (startDate) {
      session.startDate = new Date(startDate);
      session.date = new Date(startDate); // Update legacy field
    }
    if (endDate) session.endDate = new Date(endDate);
    if (registrationDeadline) session.registrationDeadline = new Date(registrationDeadline);
    if (capacity !== undefined) session.capacity = capacity;
    if (location !== undefined) session.location = location;
    if (tags !== undefined) {
      session.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) : tags;
    }
    if (isPrivate !== undefined) session.isPrivate = isPrivate;
    if (status) session.status = status;
    session.updatedAt = new Date();

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Error updating session', error: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // Find session and verify ownership
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.organization.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own sessions.' });
    }

    // Delete associated applications
    await Application.deleteMany({ session: sessionId });

    // Delete session
    await Session.findByIdAndDelete(sessionId);

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
};

// Job Seeker Session Discovery (optional auth)
export const discoverSessions = async (req, res) => {
  try {
    const userId = req.user?.id; // Optional - for checking wishlist/applications

    // Build query for public, active sessions (Remove cross-domain populate)
    let query = Session.find({
      isPrivate: false,
      status: 'Active',
      registrationDeadline: { $gte: new Date() }, // Not past registration deadline
    });

    // Search by title or description
    const search = req.query.search;
    if (search) {
      query = query.or([
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]);
    }

    // Filter by tags
    const tags = req.query.tags;
    if (tags) {
      const tagsArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
      query = query.where({ tags: { $in: tagsArray } });
    }

    // Filter by date range
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (startDate) {
      query = query.where({ startDate: { $gte: new Date(startDate) } });
    }
    if (endDate) {
      query = query.where({ startDate: { $lte: new Date(endDate) } });
    }

    // Filter by location (if provided)
    const location = req.query.location;
    if (location) {
      query = query.where({ location: { $regex: location, $options: 'i' } });
    }

    // Sort options
    const sortParam = req.query.sort || '-createdAt';
    if (sortParam === 'startDate') {
      query = query.sort({ startDate: 1 });
    } else if (sortParam === '-startDate') {
      query = query.sort({ startDate: -1 });
    } else if (sortParam === 'createdAt') {
      query = query.sort({ createdAt: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // Execute query
    let sessions = await query.exec();

    // If user is logged in, check application status and wishlist
    if (userId) {
      const user = await getUserInfo(userId);
      if (user && user.accountType === 'job_seeker') {
        const [applications, wishlist] = await Promise.all([
          Application.find({ jobSeeker: userId }).select('session status'),
          Wishlist.find({ jobSeeker: userId }).select('session')
        ]);

        const applicationMap = new Map();
        applications.forEach(app => {
          applicationMap.set(app.session.toString(), app.status);
        });

        const wishlistSet = new Set();
        wishlist.forEach(item => {
          wishlistSet.add(item.session.toString());
        });

        // Stitch organization details if needed for the list
        sessions = await Promise.all(sessions.map(async (session) => {
          const sessionObj = session.toObject();

          // Data Stitching for organization details
          const organization = await getOrganizationDetails(session.organization);
          sessionObj.organization = {
            companyInfo: organization?.companyInfo || { companyName: 'Organization' }
          };

          sessionObj.hasApplied = applicationMap.has(session._id.toString());
          sessionObj.applicationStatus = applicationMap.get(session._id.toString()) || null;
          sessionObj.isInWishlist = wishlistSet.has(session._id.toString());
          return sessionObj;
        }));
      } else {
        // User is authenticated but not a job seeker - set defaults
        sessions = sessions.map(session => {
          const sessionObj = session.toObject();
          sessionObj.hasApplied = false;
          sessionObj.applicationStatus = null;
          sessionObj.isInWishlist = false;
          return sessionObj;
        });
      }
    } else {
      // No user authenticated - set defaults
      sessions = sessions.map(session => {
        const sessionObj = session.toObject();
        sessionObj.hasApplied = false;
        sessionObj.applicationStatus = null;
        sessionObj.isInWishlist = false;
        return sessionObj;
      });
    }

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedSessions = sessions.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedSessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(sessions.length / limit),
        totalSessions: sessions.length,
        hasMore: endIndex < sessions.length
      }
    });
  } catch (error) {
    console.error('Error discovering sessions:', error);
    res.status(500).json({ message: 'Error discovering sessions', error: error.message });
  }
};

// Get single session details
export const getSessionDetails = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user?.id;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user has applied or added to wishlist
    let hasApplied = false;
    let applicationStatus = null;
    let isInWishlist = false;

    if (userId) {
      const user = await getUserInfo(userId);
      if (user && user.accountType === 'job_seeker') {
        const application = await Application.findOne({
          jobSeeker: userId,
          session: sessionId
        });

        if (application) {
          hasApplied = true;
          applicationStatus = application.status;
        }

        const Wishlist = (await import('../models/Wishlist.js')).default;
        const wishlistItem = await Wishlist.findOne({
          jobSeeker: userId,
          session: sessionId
        });
        isInWishlist = !!wishlistItem;
      }
    }

    const organization = await getOrganizationDetails(session.organization);
    const sessionObj = session.toObject();
    sessionObj.organization = organization;
    sessionObj.hasApplied = hasApplied;
    sessionObj.applicationStatus = applicationStatus;
    sessionObj.isInWishlist = isInWishlist;

    res.status(200).json({
      success: true,
      data: sessionObj
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ message: 'Error fetching session details', error: error.message });
  }
};

// Get sessions for calendar view
export const getCalendarSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserInfo(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let sessions = [];

    if (user.accountType === 'job_seeker') {
      // Return only approved sessions
      const approvedApplications = await Application.find({
        jobSeeker: userId,
        status: 'Approved',
      }).select('session');

      const sessionIds = approvedApplications.map(app => app.session);
      sessions = await Session.find({
        _id: { $in: sessionIds },
        status: { $ne: 'Cancelled' }
      });

      // Stitch organization details
      sessions = await Promise.all(sessions.map(async (session) => {
        const sessionObj = session.toObject();
        const org = await getOrganizationDetails(session.organization);
        sessionObj.organization = org;
        return sessionObj;
      }));
    } else {
      // Return all sessions for the organization
      sessions = await Session.find({ organization: userId });
    }

    // Format for FullCalendar.js
    const events = sessions.map(session => ({
      id: session._id,
      title: session.title,
      start: session.startDate,
      end: session.endDate,
      // Purple branding for buttons/tags
      backgroundColor: '#f3e8ff', // bg-purple-50
      textColor: '#9333ea',       // text-purple-600
      borderColor: '#e9d5ff',     // border-purple-200
      extendedProps: {
        description: session.description,
        location: session.location,
        status: session.status,
        isPrivate: session.isPrivate,
        organizationName: session.organization?.companyInfo?.companyName || 'Organization'
      }
    }));

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching calendar sessions:', error);
    res.status(500).json({ message: 'Error fetching calendar sessions', error: error.message });
  }
};

/**
 * Internal helper to check for upcoming sessions and create in-app reminders.
 * This is called during notification polling.
 */
export const checkUpcomingSessions = async (userId) => {
  try {
    const user = await getUserInfo(userId);
    if (!user) return;

    let sessionIds = [];
    if (user.accountType === 'job_seeker') {
      const approvedApplications = await Application.find({
        jobSeeker: userId,
        status: 'Approved'
      }).select('session');
      sessionIds = approvedApplications.map(app => app.session);
    } else if (user.accountType === 'organization') {
      const sessions = await Session.find({ organization: userId }).select('_id');
      sessionIds = sessions.map(s => s._id);
    }

    if (sessionIds.length === 0) return;

    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60000);

    const upcomingSessions = await Session.find({
      _id: { $in: sessionIds },
      startDate: { $gt: now, $lte: in30Minutes },
      status: 'Active'
    });

    for (const session of upcomingSessions) {
      // Idempotent reminder: check if a reminder for this session already exists for this user
      const reminderTitle = 'Upcoming Session Reminder';
      const reminderMessage = `Your session "${session.title}" starts soon at ${new Date(session.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`;

      const existingNotification = await Notification.findOne({
        user: userId,
        type: 'reminder',
        title: reminderTitle,
        message: reminderMessage
      });

      if (!existingNotification) {
        await notifyUser({
          userId,
          type: 'reminder',
          title: reminderTitle,
          message: reminderMessage
        });
      }
    }
  } catch (error) {
    console.error('Error checking upcoming sessions:', error);
  }
};





