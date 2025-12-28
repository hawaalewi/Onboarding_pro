// src/pages/organization/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import organizationAPI from '../../api/organizationApi';
import api from '../../api/axiosInstance';
import { Building2, Zap, MessageSquare, Users, Calendar, FileText } from 'lucide-react';
import ActivityLogList from '../../components/ActivityLogList';

const QuickStatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="p-4 bg-white rounded-lg border border-gray-200 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </div>
);

const DashboardOverview = () => {
  const [stats, setStats] = useState({ sessions: 0, applications: 0, messages: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organization stats
        const [sessionsRes, applicationsRes, notificationsRes] = await Promise.all([
          organizationAPI.get('/sessions'),
          organizationAPI.get('/applications'),
          api.get('/notifications'),
        ]);

        setStats({
          sessions: sessionsRes.data.length || 0,
          applications: applicationsRes.data.length || 0,
          messages: notificationsRes.data.filter(n => !n.read).length || 0,
        });

        // Fetch recent sessions (Top 5)
        const recentSessionsRes = await organizationAPI.get('/sessions?limit=5&sort=-createdAt');
        setRecentSessions(recentSessionsRes.data);

        // Fetch pending applications (Top 5)
        const pendingAppsRes = await organizationAPI.get('/applications?status=Pending&limit=5');
        setPendingApplications(pendingAppsRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      {/* QUICK STATS */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickStatCard
          title="Total Sessions"
          value={stats.sessions}
          icon={Zap}
          colorClass="text-purple-600"
        />
        <QuickStatCard
          title="Total Applications"
          value={stats.applications}
          icon={FileText}
          colorClass="text-purple-600"
        />
        <QuickStatCard
          title="New Messages"
          value={stats.messages}
          icon={MessageSquare}
          colorClass="text-red-500"
        />
      </div>

      {/* RECENT SESSIONS TABLE */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Sessions</h2>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentSessions.length > 0 ? (
              recentSessions.map((session, index) => (
                <tr key={session._id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">{session.title || 'Untitled Session'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.startDate || session.date || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${session.status === 'Active' ? 'bg-green-100 text-green-800' :
                      session.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {session.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session.currentApplications || 0} / {session.capacity || 50}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No sessions found. Create your first session!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PENDING APPLICATIONS LIST */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Applications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingApplications.length > 0 ? (
          pendingApplications.map((app, index) => (
            <div key={app._id || index} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-purple-600">{app.sessionTitle || 'Session Application'}</h3>
                  <p className="text-xs text-gray-500 mb-2">Applied: {new Date(app.dateApplied || Date.now()).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Applicant: {app.jobSeekerName || 'Job Seeker'}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                  Approve
                </button>
                <button className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-gray-500">No pending applications found.</div>
        )}
      </div>

      {/* RECENT ACTIVITY */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Recent Activity</h2>
      <div className="mb-10">
        <ActivityLogList limit={5} />
      </div>
    </div>
  );
};

export default DashboardOverview;

