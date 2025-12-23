import Application from '../models/Application.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

// GET /api/export/session/:sessionId/applicants?format=csv
export const exportApplicants = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { format } = req.query; // 'csv' default

        // Verify organization ownership
        const userId = req.user.id;
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.organization.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to export this session' });
        }

        // Fetch applications with populated job seeker data
        const applications = await Application.find({ session: sessionId })
            .populate({
                path: 'jobSeeker',
                select: 'personalInfo email profileCompletion'
            })
            .exec();

        if (format === 'csv' || !format) {
            // Generate CSV
            let csv = 'Full Name,Email,Status,Profile Completion %,Skills,Date Applied\n';

            applications.forEach(app => {
                const js = app.jobSeeker;
                const info = js.personalInfo || {};

                const fullName = info.fullName ? `"${info.fullName}"` : '';
                const email = js.email;
                const status = app.status;
                const completion = js.profileCompletion?.percent || 0;
                const skills = info.skills ? `"${info.skills.join(', ')}"` : '';
                const date = app.dateApplied ? new Date(app.dateApplied).toISOString().split('T')[0] : '';

                csv += `${fullName},${email},${status},${completion},${skills},${date}\n`;
            });

            res.header('Content-Type', 'text/csv');
            res.attachment(`applicants_session_${sessionId}.csv`);
            return res.send(csv);
        }

        // Fallback/Extensible for other formats
        res.status(400).json({ message: 'Unsupported format. Use format=csv' });

    } catch (error) {
        console.error('Error exporting applicants:', error);
        res.status(500).json({ message: 'Error exporting applicants', error: error.message });
    }
};
