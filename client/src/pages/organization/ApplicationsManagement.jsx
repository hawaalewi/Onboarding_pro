// src/pages/organization/ApplicationsManagement.jsx
import React, { useState, useEffect } from 'react';
import organizationAPI from '../../api/organizationApi';
import { CheckCircle, XCircle, FileText, Calendar, User } from 'lucide-react';

import ApplicantDetailsModal from '../../components/ApplicantDetailsModal';

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Pending, Approved, Rejected
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = filter !== 'All' ? { status: filter } : {};
      const response = await organizationAPI.get('/applications', { params });
      setApplications(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setError('');
      setMessage('');
      await organizationAPI.put(`/applications/${applicationId}/status`, { status: newStatus });
      setMessage(`Application ${newStatus.toLowerCase()} successfully!`);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating application status');
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-gray-500">Loading applications...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications Management</h1>
        <p className="text-gray-600 mb-6">Review and manage candidate applications for your sessions</p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${filter === status
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.length > 0 ? (
              applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50/80 transition-colors duration-150 group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{app.sessionTitle || 'Untitled Session'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{app.jobSeekerName || 'Job Seeker'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(app.dateApplied || Date.now()).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApplicant(app);
                          setIsModalOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-1.5" />
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ApplicantDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedApplicant(null);
        }}
        applicant={selectedApplicant}
        onStatusChange={handleStatusChange}
      />
    </div >
  );
};

export default ApplicationsManagement;

