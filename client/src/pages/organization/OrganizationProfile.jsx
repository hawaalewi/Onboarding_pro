// src/pages/organization/OrganizationProfile.jsx
import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userApi';
import { createOrganization, updateOrganization, closeOrganization } from '../../api/organizationApi';
import { Building2, Mail, MapPin, Upload, Briefcase, AlertTriangle, Globe, Phone, FileText } from 'lucide-react';
import ProfileCompletionBar from '../../components/ProfileCompletionBar';
import placeholderImg from '../../assets/placeholder.svg';


const OrganizationProfile = () => {
  const [profileData, setProfileData] = useState({
    companyName: '',
    email: '',
    industry: '',
    address: '',
    location: '',
    description: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: '',
    isActive: true
  });
  const [completion, setCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, completionRes] = await Promise.all([
        userAPI.get('/profile'),
        userAPI.get('/me/profile-completion')
      ]);

      if (profileRes.data.success) {
        const { companyInfo, email, isActive } = profileRes.data.data;
        const hasCompanyInfo = companyInfo?.companyName;

        setProfileData({

          companyName: companyInfo?.companyName || '',
          email: email || '',
          industry: companyInfo?.industry || '',
          address: companyInfo?.address || '',
          location: companyInfo?.location || '',
          description: companyInfo?.description || '',
          website: companyInfo?.website || '',
          contactEmail: companyInfo?.contactEmail || '',
          contactPhone: companyInfo?.contactPhone || '',
          logoUrl: companyInfo?.logoUrl || '',
          isActive: isActive !== false // Handle undefined as true
        });

        if (completionRes.data.success) {
          setCompletion(completionRes.data.data);
        }

        if (!hasCompanyInfo) {
          setMessage('Please complete your organization profile setup.');
        }
      } else {
        setError(response.data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    if (error) setError('');
    if (message) setMessage('');
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    setValidationErrors([]);

    try {
      // Determine if this is create or update
      const isNewOrganization = !profileData.companyName ||
        profileData.companyName.trim() === '';

      const companyInfo = {

        companyName: profileData.companyName.trim(),
        industry: profileData.industry.trim(),
        address: profileData.address.trim(),
        location: profileData.location.trim(),
        description: profileData.description.trim(),
        website: profileData.website.trim(),
        contactEmail: profileData.contactEmail.trim(),
        contactPhone: profileData.contactPhone.trim(),
        logoUrl: profileData.logoUrl.trim()
      };

      let response;
      if (isNewOrganization) {
        // First time setup
        response = await createOrganization(companyInfo);
      } else {
        // Update existing
        response = await updateOrganization(companyInfo);
      }

      if (response.data.success) {
        setMessage('Profile saved successfully!');
        fetchProfile(); // Refresh data
      } else {
        setError(response.data.message || 'Failed to save profile');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Error saving profile');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await userAPI.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setProfileData(prev => ({ ...prev, logoUrl: response.data.data.logoUrl }));
        setMessage('Logo uploaded successfully!');
      } else {
        setError(response.data.message || 'Failed to upload logo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleCloseOrganization = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to close your organization account?\n\n' +
      'This will:\n' +
      '• Prevent you from creating new sessions\n' +
      '• Deactivate your organization profile\n' +
      '• Require support to reactivate\n\n' +
      'This action cannot be undone without contacting support.'
    );

    if (!confirmed) return;

    try {
      const response = await closeOrganization();
      if (response.data.success) {
        setMessage('Organization closed successfully. You will be logged out in 3 seconds.');
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to close organization');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error closing organization');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Organization Profile</h1>

      <ProfileCompletionBar completion={completion} />

      {/* Status Warning */}
      {profileData.isActive === false && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <p className="text-yellow-800 text-sm font-semibold">Account Closed</p>
            <p className="text-yellow-700 text-sm mt-1">
              Your organization account is closed. Please contact support to reactivate.
            </p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-semibold mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside text-red-700 text-sm">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Company Information</h2>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                className="h-24 w-24 rounded-lg object-cover border-4 border-blue-200"
                src={profileData.logoUrl || placeholderImg}
                alt="Company Logo"
                onError={(e) => { e.target.src = placeholderImg; }}
              />
              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white text-xs">Uploading...</div>
                </div>
              )}
            </div>
            <div>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                <Upload className="w-4 h-4 mr-2" />
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={profileData.companyName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Industry
            </label>
            <input
              type="text"
              name="industry"
              value={profileData.industry}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter industry"
            />
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Address
            </label>
            <textarea
              name="address"
              value={profileData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location (City, Country)
            </label>
            <input
              type="text"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. New York, USA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <input
              type="url"
              name="website"
              value={profileData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Public Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={profileData.contactEmail}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Public Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={profileData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <textarea
              name="description"
              value={profileData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your organization..."
            />
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={submitting || profileData.isActive === false}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        {
          profileData.isActive !== false && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
              <button
                type="button"
                onClick={handleCloseOrganization}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Close Organization Account
              </button>
              <p className="mt-2 text-sm text-gray-500">
                This will deactivate your organization account. You won't be able to create new sessions.
              </p>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default OrganizationProfile;

