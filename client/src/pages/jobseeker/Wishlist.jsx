// src/pages/jobseeker/Wishlist.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { Heart, Calendar, MapPin, Users, BookOpen, Trash2 } from 'lucide-react';

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist');
      setWishlistItems(response.data.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (sessionId) => {
    try {
      await api.delete(`/wishlist/${sessionId}`);
      setWishlistItems(prev => prev.filter(item => item.session._id !== sessionId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      alert(error.response?.data?.message || 'Error removing from wishlist');
    }
  };

  const handleViewDetails = (sessionId) => {
    navigate(`/dashboard/job_seeker/sessions/${sessionId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600">Sessions you've saved for later</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Your wishlist is empty</p>
          <button
            onClick={() => navigate('/dashboard/job_seeker/sessions')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Sessions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => {
            const session = item.session;
            if (!session) return null;

            return (
              <div
                key={item._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-purple-600 line-clamp-2 flex-1">{session.title}</h3>
                  <button
                    onClick={() => handleRemove(session._id)}
                    className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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

                <button
                  onClick={() => handleViewDetails(session._id)}
                  className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

