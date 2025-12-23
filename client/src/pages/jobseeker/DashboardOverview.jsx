// src/pages/jobseeker/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { DollarSign, Zap, MessageSquare, Briefcase, Calendar } from 'lucide-react';
import ActivityLogList from '../../components/ActivityLogList';

// --- Placeholder Components for Dashboard Widgets ---

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
  const [stats, setStats] = useState({ applications: 0, sessions: 0, messages: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 1. Fetch Quick Stats (Simulated combined API call) ---
        // NOTE: In a real app, you might have one consolidated endpoint: GET /api/jobseeker/dashboard/stats
        const [appsRes, calendarRes, notificationsRes] = await Promise.all([
          api.get('/applications'), // Count total applications
          api.get('/jobseeker/calendar'), // Count upcoming approved sessions
          api.get('/notifications'), // Count unread messages/notifications
        ]);

        setStats({
          applications: appsRes.data.length || 0, // Placeholder counting all applications
          sessions: calendarRes.data.length || 0, // Placeholder counting all calendar entries
          messages: notificationsRes.data.filter(n => !n.read).length || 0, // Counting unread
        });

        // --- 2. Fetch Recent Applications (Top 5 applications) ---
        // Assuming GET /api/applications supports filtering/sorting
        const recentAppsRes = await api.get('/applications?limit=5&sort=-dateApplied');
        setRecentApplications(recentAppsRes.data);

        // --- 3. Fetch Upcoming Sessions (Top 2 upcoming approved sessions) ---
        // Assuming GET /api/jobseeker/calendar supports sorting
        const upcomingSessionsRes = await api.get('/jobseeker/calendar?limit=2&sort=date');
        setUpcomingSessions(upcomingSessionsRes.data);

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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>

      {/* QUICK STATS */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <QuickStatCard
          title="Total Applications"
          value={stats.applications}
          icon={Briefcase}
          colorClass="text-purple-600"
        />
        <QuickStatCard
          title="Upcoming Sessions"
          value={stats.sessions}
          icon={Zap}
          colorClass="text-purple-600"
        />
        <QuickStatCard
          title="New Messages"
          value={stats.messages}
          icon={MessageSquare}
          colorClass="text-red-500"
        />
      </div>

      {/* RECENT APPLICATIONS TABLE */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Applications</h2>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentApplications.length > 0 ? (
              recentApplications.map((app, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">{app.sessionTitle || 'UX/UI Modern Training'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.dateApplied || '2025-10-20').toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {app.status || 'Approved'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.organization || 'Nexa Solutions'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No recent applications found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* UPCOMING SESSIONS LIST */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Sessions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingSessions.length > 0 ? (
          upcomingSessions.map((session, index) => (
            <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-purple-600">{session.title || 'UX/UI Team Meetup'}</h3>
                  <p className="text-xs text-gray-500 mb-2">Approved: {new Date(session.date || '2025-12-01').toLocaleDateString()}</p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{session.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce posuere tortor sem, quis dictum nisl vulputate et.'}</p>
              <button className="mt-3 text-sm text-purple-600 hover:text-purple-800 font-medium">View Details &rarr;</button>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-gray-500">No upcoming approved sessions found.</div>
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