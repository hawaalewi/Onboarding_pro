// src/pages/jobseeker/SessionDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Calendar, MapPin, Users, Tag, Heart, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${id}`);
      setSession(response.data.data);
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      await api.post('/applications', { sessionId: id });
      // Refresh session details to update application status
      await fetchSessionDetails();
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      setWishlistLoading(true);
      if (session.isInWishlist) {
        await api.delete(`/wishlist/${id}`);
        setSession(prev => ({ ...prev, isInWishlist: false }));
      } else {
        await api.post('/wishlist', { sessionId: id });
        setSession(prev => ({ ...prev, isInWishlist: true }));
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert(error.response?.data?.message || 'Error updating wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading session details...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Session not found</div>
      </div>
    );
  }

  const isRegistrationOpen = new Date(session.registrationDeadline) > new Date();
  const isAtCapacity = session.currentApplications >= session.capacity;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/dashboard/job_seeker/sessions')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Sessions
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">{session.title}</h1>
            {session.organization?.companyInfo?.companyName && (
              <p className="text-lg text-gray-600">{session.organization.companyInfo.companyName}</p>
            )}
          </div>
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`p-3 rounded-full transition-colors ${session.isInWishlist
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Heart className={`w-6 h-6 ${session.isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
          <p className="text-gray-700 leading-relaxed">{session.description}</p>
        </div>

        {/* Session Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-start p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-gray-900 font-medium">{formatDate(session.startDate)}</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="text-gray-900 font-medium">{formatDate(session.endDate)}</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Registration Deadline</p>
              <p className="text-gray-900 font-medium">{formatDate(session.registrationDeadline)}</p>
            </div>
          </div>

          {session.location && (
            <div className="flex items-start p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900 font-medium">{session.location}</p>
              </div>
            </div>
          )}

          <div className="flex items-start p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="text-gray-900 font-medium">
                {session.currentApplications} / {session.capacity} applicants
              </p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-gray-50 rounded-xl">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-gray-900 font-medium">{session.status}</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {session.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Application Status / Action */}
        <div className="border-t border-gray-200 pt-6">
          {session.hasApplied ? (
            <div className="flex items-center gap-3">
              {session.applicationStatus === 'Approved' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : session.applicationStatus === 'Rejected' ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <p className="text-lg font-semibold text-gray-900">Application Status</p>
                <p className={`text-lg font-medium ${session.applicationStatus === 'Approved'
                  ? 'text-green-600'
                  : session.applicationStatus === 'Rejected'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                  }`}>
                  {session.applicationStatus}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {!isRegistrationOpen ? (
                <p className="text-red-600 font-medium mb-4">Registration deadline has passed</p>
              ) : isAtCapacity ? (
                <p className="text-red-600 font-medium mb-4">This session is at full capacity</p>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                >
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;

