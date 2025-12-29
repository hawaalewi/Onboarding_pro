// src/pages/organization/SessionsManagement.jsx
import React, { useState, useEffect } from 'react';
import organizationAPI from '../../api/organizationApi';
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, Tag, Download } from 'lucide-react';

const SessionsManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    capacity: 50,
    location: '',
    tags: '',
    isPrivate: false,
    status: 'Active'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.get('/sessions');
      setSessions(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingSession) {
        await organizationAPI.put(`/sessions/${editingSession._id}`, formData);
        setMessage('Session updated successfully!');
      } else {
        await organizationAPI.post('/sessions', formData);
        setMessage('Session created successfully!');
      }

      setShowForm(false);
      setEditingSession(null);
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        capacity: 50,
        location: '',
        tags: '',
        isPrivate: false,
        status: 'Active'
      });
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving session');
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setFormData({
      title: session.title || '',
      description: session.description || '',
      startDate: session.startDate ? new Date(session.startDate).toISOString().split('T')[0] : '',
      endDate: session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : '',
      registrationDeadline: session.registrationDeadline ? new Date(session.registrationDeadline).toISOString().split('T')[0] : '',
      capacity: session.capacity || 50,
      location: session.location || '',
      tags: Array.isArray(session.tags) ? session.tags.join(', ') : session.tags || '',
      isPrivate: session.isPrivate || false,
      status: session.status || 'Active'
    });
    setShowForm(true);
  };


  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    try {
      await organizationAPI.delete(`/sessions/${sessionId}`);
      setMessage('Session deleted successfully!');
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting session');
    }
  };

  const handleExport = (sessionId, title) => {
    // Create a temporary link to download
    const url = `http://localhost:5000/api/export/session/${sessionId}/applicants?format=csv`;
    // We open in new window which usually triggers download
    window.open(url, '_blank');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSession(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      capacity: 50,
      location: '',
      tags: '',
      isPrivate: false,
      status: 'Active'
    });
  };

  if (loading) {
    return <div className="text-center p-8 text-gray-500">Loading sessions...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sessions Management</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Session
          </button>
        )}
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

      {showForm && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingSession ? 'Edit Session' : 'Create New Session'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Deadline *</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Virtual or Physical location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., workshop, training, onboarding"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Private Session</label>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                {editingSession ? 'Update Session' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-purple-600">{session.title}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${session.status === 'Active' ? 'bg-green-100 text-green-800' :
                  session.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                  {session.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{session.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(session.startDate || session.date || Date.now()).toLocaleDateString()}
                </div>
                {session.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {session.location}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {session.currentApplications || 0} / {session.capacity || 50} applicants
                </div>
                {session.tags && session.tags.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="w-4 h-4 mr-2" />
                    {Array.isArray(session.tags) ? session.tags.join(', ') : session.tags}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-auto">
                <button
                  onClick={() => handleExport(session._id, session.title)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition text-sm flex items-center justify-center border border-green-200"
                  title="Export Applicants CSV"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
                <button
                  onClick={() => handleEdit(session)}
                  className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition text-sm flex items-center justify-center border border-purple-200"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(session._id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition text-sm flex items-center justify-center border border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center p-8 text-gray-500">
            No sessions found. Create your first session!
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionsManagement;

