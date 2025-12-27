import Application from '../models/Application.js';
import { getUserInfo, getOrganizationSessions, notifyUser, getSessionDetails, updateSessionStats, emitEvent } from '../utils/InternalCommunication.js';

export const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Build query (Remove cross-domain populate)
    let query = Application.find({ jobSeeker: userId });

    // Handle sort parameter
    const sortParam = req.query.sort;
    if (sortParam) {
      if (sortParam === '-dateApplied') {
        query = query.sort({ dateApplied: -1 });
      } else if (sortParam === 'dateApplied') {
        query = query.sort({ dateApplied: 1 });
      }
    } else {
      // Default sort by dateApplied descending
      query = query.sort({ dateApplied: -1 });
    }

    // Execute query
    let applications = await query.exec();

    // Handle limit parameter
    const limit = parseInt(req.query.limit);
    if (limit && limit > 0) {
      applications = applications.slice(0, limit);
    }

    // Format response with manual stitching
    const formattedApplications = await Promise.all(applications.map(async (app) => {
      const session = await getSessionDetails(app.session);
      return {
        sessionTitle: session?.title || 'Untitled Session',
        dateApplied: app.dateApplied,
        status: app.status === 'Selected' ? 'Approved' : app.status,
        organization: app.organizationName,
      };
    }));

    res.status(200).json(formattedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

// Organization Application Management
export const getOrganizationApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all sessions owned by this organization via InternalCommunication
    const sessions = await getOrganizationSessions(userId);
    const sessionIds = sessions.map(s => s._id);

    // Build query for applications (Remove cross-domain populate)
    let query = Application.find({ session: { $in: sessionIds } });

    // Filter by status if provided
    const status = req.query.status;
    if (status && status !== 'All') {
      query = query.where({ status });
    }

    // Handle sort parameter
    const sortParam = req.query.sort;
    if (sortParam) {
      if (sortParam === '-dateApplied') {
        query = query.sort({ dateApplied: -1 });
      } else if (sortParam === 'dateApplied') {
        query = query.sort({ dateApplied: 1 });
      }
    } else {
      query = query.sort({ dateApplied: -1 });
    }

    // Execute query
    let applications = await query.exec();

    // Handle limit parameter
    const limit = parseInt(req.query.limit);
    if (limit && limit > 0) {
      applications = applications.slice(0, limit);
    }

    // Format response with manual stitching
    const formattedApplications = await Promise.all(applications.map(async (app) => {
      const [session, jobSeeker] = await Promise.all([
        getSessionDetails(app.session),
        getUserInfo(app.jobSeeker)
      ]);

      return {
        _id: app._id,
        sessionTitle: session?.title || 'Untitled Session',
        sessionId: app.session,
        dateApplied: app.dateApplied,
        status: app.status === 'Selected' ? 'Approved' : app.status,
        jobSeekerName: jobSeeker?.personalInfo?.fullName || jobSeeker?.email || 'Job Seeker',
        jobSeekerId: app.jobSeeker,
        applicantDetails: {
          personalInfo: jobSeeker?.personalInfo,
          profileCompletion: jobSeeker?.profileCompletion,
          email: jobSeeker?.email
        }
      };
    }));

    res.status(200).json(formattedApplications);
  } catch (error) {
    console.error('Error fetching organization applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = req.params.id;
    let { status } = req.body;

    // Map frontend 'Approved' to backend 'Selected'
    if (status === 'Approved') {
      status = 'Selected';
    }

    // Validate status
    if (!['Pending', 'Shortlisted', 'Selected', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Find application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify the session via InternalCommunication (Ownership Validation)
    const session = await getSessionDetails(application.session);
    if (!session || session.organization.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only manage applications for your own sessions.' });
    }

    const oldStatus = application.status;
    if (oldStatus === status) {
      return res.status(200).json({ success: true, message: 'Status is already ' + (status === 'Selected' ? 'Approved' : status), data: application });
    }

    // Capacity check if moving to Selected (Approved)
    if (status === 'Selected' && oldStatus !== 'Selected') {
      if (session.currentApplications >= session.capacity) {
        return res.status(400).json({ message: 'Cannot approve. Session is at full capacity.' });
      }
    }

    // Update session counts and stats
    const updateQuery = { $inc: {} };

    // 1. Update currentApplications
    if (status === 'Selected' && oldStatus !== 'Selected') {
      updateQuery.$inc.currentApplications = 1;
    } else if (oldStatus === 'Selected' && status !== 'Selected') {
      updateQuery.$inc.currentApplications = -1;
    }

    // 2. Update applicantStats
    const oldKey = `applicantStats.${oldStatus.toLowerCase()}`;
    const newKey = `applicantStats.${status.toLowerCase()}`;
    updateQuery.$inc[oldKey] = -1;
    updateQuery.$inc[newKey] = 1;

    // Remove empty $inc if no changes
    if (Object.keys(updateQuery.$inc).length === 0) delete updateQuery.$inc;

    // Save updates
    application.status = status;
    await Promise.all([
      application.save(),
      updateSessionStats(session._id, updateQuery)
    ]);

    // Emit event for observability
    await emitEvent('application_status_updated', { applicationId, oldStatus, newStatus: status });

    res.status(200).json({
      success: true,
      message: `Application ${status === 'Selected' ? 'approved' : status.toLowerCase()} successfully`,
      data: {
        ...application.toObject(),
        status: status === 'Selected' ? 'Approved' : status
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
};

// Job Seeker Application Submission
export const submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    // Validate sessionId
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Check if session exists and is available via InternalCommunication
    const session = await getSessionDetails(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if session is private
    if (session.isPrivate) {
      return res.status(403).json({ message: 'This session is private and not available for public applications.' });
    }

    // Check if registration deadline has passed
    if (new Date(session.registrationDeadline) < new Date()) {
      return res.status(400).json({ message: 'Registration deadline has passed for this session.' });
    }

    // Check if session is at capacity
    if (session.currentApplications >= session.capacity) {
      return res.status(400).json({ message: 'This session is at full capacity.' });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      jobSeeker: userId,
      session: sessionId
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied to this session.',
        data: existingApplication
      });
    }

    // Create new application
    const newApplication = new Application({
      jobSeeker: userId,
      session: sessionId,
      status: 'Pending',
      organizationName: session.organizationName || 'Organization' // Assume stored on Session or fetched
    });

    // Stitch organization name if needed (Wait, session model has organization as an ID)
    // For now, if organizationName isn't on session, we might need a quick stitch.
    if (!session.organizationName) {
      const org = await getUserInfo(session.organization);
      newApplication.organizationName = org?.companyInfo?.companyName || 'Organization';
    }

    await newApplication.save();

    // Emit event for capacity/notifications (simulated synchronous here)
    await emitEvent('session_applied', { userId, sessionId });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication
    });
  } catch (error) {
    console.error('Error submitting application:', error);

    // Handle duplicate key error (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied to this session.' });
    }

    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
};





