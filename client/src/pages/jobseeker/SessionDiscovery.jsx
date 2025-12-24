// src/pages/jobseeker/SessionDiscovery.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Search, Calendar, MapPin, Users, Tag, Heart, BookOpen } from 'lucide-react';

const SessionDiscovery = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasMore: false });

  // Available tags (could be fetched from API in the future)
  const availableTags = ['Technology', 'Design', 'Marketing', 'Business', 'Engineering', 'Healthcare', 'Education'];

  useEffect(() => {
    fetchSessions();
  }, [searchTerm, selectedTags, sortBy]);

  const fetchSessions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: sortBy
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await api.get(`/sessions/discover?${params.toString()}`);
      setSessions(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSessionClick = (sessionId) => {
    navigate(`/dashboard/job_seeker/sessions/${sessionId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Discover Sessions</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search sessions by title, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="startDate">Start Date (Earliest)</option>
              <option value="-startDate">Start Date (Latest)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Tags:</span>
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No sessions found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sessions.map((session) => (
              <div
                key={session._id}
                onClick={() => handleSessionClick(session._id)}
                className="group bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:border-purple-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2">{session.title}</h3>
                  {session.isInWishlist && (
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{session.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(session.startDate)}
                  </div>
                  {session.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      {session.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    {session.currentApplications} / {session.capacity} applicants
                  </div>
                  {session.organization?.companyInfo?.companyName && (
                    <div className="text-sm text-gray-600 font-medium">
                      {session.organization.companyInfo.companyName}
                    </div>
                  )}
                </div>

                {session.tags && session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {session.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  {session.hasApplied ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${session.applicationStatus === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : session.applicationStatus === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {session.applicationStatus}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Not Applied</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSessionClick(session._id);
                    }}
                    className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 font-semibold text-sm flex items-center transition-colors"
                  >
                    View Details <BookOpen className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => fetchSessions(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchSessions(pagination.currentPage + 1)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SessionDiscovery;

