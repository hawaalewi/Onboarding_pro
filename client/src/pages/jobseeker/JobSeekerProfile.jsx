import React, { useState, useEffect } from 'react';
import userAPI from '../../api/userApi';
import { User, Mail, Phone, FileText, Briefcase, Calendar, Plus, Edit2, Trash2, Upload, X, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import ProfileCompletionBar from '../../components/ProfileCompletionBar';
import SocialLinksForm from '../../components/SocialLinksForm';
import EducationSection from '../../components/EducationSection';
import placeholderImg from '../../assets/placeholder.svg';

const JobSeekerProfile = () => {
  const [profileData, setProfileData] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    bio: '',
    profilePhotoUrl: '',
    skills: [],
    experience: [],
    resumeUrl: ''
  });
  const [metrics, setMetrics] = useState({
    applicationsCount: 0,
    sessionsCount: 0
  });
  const [completion, setCompletion] = useState(null); // { percent, missingFields }

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Skills management
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [editingSkillIndex, setEditingSkillIndex] = useState(null);

  // Experience management
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [expandedExperience, setExpandedExperience] = useState(false);
  const [newExperience, setNewExperience] = useState({
    company: '',
    startDate: '',
    endDate: '',
    description: '',
    isCurrent: false
  });
  const [editingExperienceIndex, setEditingExperienceIndex] = useState(null);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // Parallel fetch for details and completion
      const [detailsRes, completionRes] = await Promise.all([
        userAPI.get('/profile/details'),
        userAPI.get('/me/profile-completion')
      ]);

      if (detailsRes.data.success) {
        const { personalInfo, metrics: profileMetrics } = detailsRes.data.data;
        setProfileData({
          fullName: personalInfo.fullName || '',
          emailAddress: personalInfo.emailAddress || detailsRes.data.data.email || '',
          phoneNumber: personalInfo.phoneNumber || '',
          bio: personalInfo.bio || '',
          profilePhotoUrl: personalInfo.profilePhotoUrl || '',
          skills: personalInfo.skills || [],
          experience: personalInfo.experience || [],
          resumeUrl: personalInfo.resumeUrl || ''
        });
        setMetrics(profileMetrics || { applicationsCount: 0, sessionsCount: 0 });
      } else {
        setError(detailsRes.data.message || 'Failed to fetch profile');
      }

      if (completionRes.data.success) {
        setCompletion(completionRes.data.data);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshCompletion = async () => {
    try {
      const res = await userAPI.get('/me/profile-completion');
      if (res.data.success) setCompletion(res.data.data);
    } catch (e) { console.error(e); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    setFieldErrors({});

    try {
      const response = await userAPI.post('/profile/save', {
        fullName: profileData.fullName,
        emailAddress: profileData.emailAddress,
        phoneNumber: profileData.phoneNumber,
        bio: profileData.bio
      });

      if (response.data.success) {
        setMessage('Profile saved successfully!');
        // Update profile data
        const { personalInfo } = response.data.data;
        setProfileData(prev => ({
          ...prev,
          fullName: personalInfo.fullName || prev.fullName,
          emailAddress: personalInfo.emailAddress || prev.emailAddress,
          phoneNumber: personalInfo.phoneNumber || prev.phoneNumber,
          bio: personalInfo.bio || prev.bio
        }));
        refreshCompletion(); // Refresh bar
      } else {
        if (response.data.errors && Array.isArray(response.data.errors)) {
          const errors = {};
          response.data.errors.forEach(errMsg => {
            if (errMsg.includes('Full name')) errors.fullName = errMsg;
            else if (errMsg.includes('Email')) errors.emailAddress = errMsg;
            else if (errMsg.includes('Phone')) errors.phoneNumber = errMsg;
            else if (errMsg.includes('Bio')) errors.bio = errMsg;
          });
          setFieldErrors(errors);
          if (Object.keys(errors).length === 0) {
            setError(response.data.message || 'Validation error');
          }
        } else {
          setError(response.data.message || 'Failed to save profile');
        }
      }
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errors = {};
        err.response.data.errors.forEach(errMsg => {
          if (errMsg.includes('Full name')) errors.fullName = errMsg;
          else if (errMsg.includes('Email')) errors.emailAddress = errMsg;
          else if (errMsg.includes('Phone')) errors.phoneNumber = errMsg;
          else if (errMsg.includes('Bio')) errors.bio = errMsg;
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) {
          setError(err.response?.data?.message || 'Error saving profile');
        }
      } else {
        setError(err.response?.data?.message || 'Error saving profile');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const response = await userAPI.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setProfileData(prev => ({ ...prev, profilePhotoUrl: response.data.data.profilePhotoUrl }));
        setMessage('Profile photo uploaded successfully!');
      } else {
        setError(response.data.message || 'Failed to upload photo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = ''; // Reset file input
      refreshCompletion();
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingResume(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await userAPI.post('/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setProfileData(prev => ({ ...prev, resumeUrl: response.data.data.resumeUrl }));
        setMessage('Resume uploaded successfully!');
      } else {
        setError(response.data.message || 'Failed to upload resume');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading resume');
    } finally {
      setUploadingResume(false);
      e.target.value = ''; // Reset file input
      refreshCompletion();
    }
  };

  // Skills management
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const response = await userAPI.post('/skills', { skill: newSkill });
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, skills: response.data.data.skills }));
        setNewSkill('');
        setShowAddSkill(false);
        setMessage('Skill added successfully!');
        refreshCompletion();
      } else {
        setError(response.data.message || 'Failed to add skill');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding skill');
    }
  };

  const handleUpdateSkill = async (index) => {
    if (!newSkill.trim()) return;

    try {
      const response = await userAPI.put(`/skills/${index}`, { skill: newSkill });
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, skills: response.data.data.skills }));
        setNewSkill('');
        setEditingSkillIndex(null);
        setMessage('Skill updated successfully!');
      } else {
        setError(response.data.message || 'Failed to update skill');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating skill');
    }
  };

  const handleDeleteSkill = async (index) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      const response = await userAPI.delete(`/skills/${index}`);
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, skills: response.data.data.skills }));
        setMessage('Skill deleted successfully!');
      } else {
        setError(response.data.message || 'Failed to delete skill');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting skill');
    }
  };

  // Experience management
  const handleAddExperience = async () => {
    if (!newExperience.company.trim() || !newExperience.startDate) {
      setError('Company and start date are required');
      return;
    }

    try {
      const response = await userAPI.post('/experience', newExperience);
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, experience: response.data.data.experience }));
        setNewExperience({ company: '', startDate: '', endDate: '', description: '', isCurrent: false });
        setShowAddExperience(false);
        setShowAddExperience(false);
        setMessage('Experience added successfully!');
        refreshCompletion();
      } else {
        setError(response.data.message || 'Failed to add experience');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding experience');
    }
  };

  const handleUpdateExperience = async (index) => {
    if (!newExperience.company.trim() || !newExperience.startDate) {
      setError('Company and start date are required');
      return;
    }

    try {
      const response = await userAPI.put(`/experience/${index}`, newExperience);
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, experience: response.data.data.experience }));
        setNewExperience({ company: '', startDate: '', endDate: '', description: '', isCurrent: false });
        setEditingExperienceIndex(null);
        setMessage('Experience updated successfully!');
      } else {
        setError(response.data.message || 'Failed to update experience');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating experience');
    }
  };

  const handleDeleteExperience = async (index) => {
    if (!window.confirm('Are you sure you want to delete this experience entry?')) return;

    try {
      const response = await userAPI.delete(`/experience/${index}`);
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, experience: response.data.data.experience }));
        setMessage('Experience deleted successfully!');
      } else {
        setError(response.data.message || 'Failed to delete experience');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting experience');
    }
  };

  const startEditSkill = (index, skill) => {
    setEditingSkillIndex(index);
    setNewSkill(skill);
    setShowAddSkill(true);
  };

  const startEditExperience = (index, exp) => {
    setEditingExperienceIndex(index);
    setNewExperience({
      company: exp.company || '',
      startDate: exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : '',
      endDate: exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '',
      description: exp.description || '',
      isCurrent: exp.isCurrent || false
    });
    setShowAddExperience(true);
  };

  const cancelEdit = () => {
    setShowAddSkill(false);
    setShowAddExperience(false);
    setEditingSkillIndex(null);
    setEditingExperienceIndex(null);
    setNewSkill('');
    setNewExperience({ company: '', startDate: '', endDate: '', description: '', isCurrent: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
            <p className="text-gray-500 mt-1">Manage your public profile and career details</p>
          </div>
        </div>

        <ProfileCompletionBar completion={completion} />

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: Identity, Skills, Socials, Resume (Span 4) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Identity Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <img
                  className="h-32 w-32 rounded-full object-cover border-4 border-white ring-4 ring-purple-50"
                  src={profileData.profilePhotoUrl || placeholderImg}
                  alt="Profile"
                  onError={(e) => { e.target.src = placeholderImg; }}
                />
                <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profileData.fullName || 'Your Name'}</h2>
              <p className="text-sm text-gray-500 mb-1">{profileData.emailAddress || 'email@example.com'}</p>
              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full mt-2">Job Seeker</p>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-500" /> Skills
                </h3>
                {!showAddSkill && (
                  <button
                    onClick={() => {
                      setShowAddSkill(true);
                      setEditingSkillIndex(null);
                      setNewSkill('');
                    }}
                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    title="Add Skill"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {showAddSkill && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2 text-sm"
                    placeholder="e.g. React.js"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editingSkillIndex !== null ? handleUpdateSkill(editingSkillIndex) : handleAddSkill()}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition text-sm font-medium"
                    >
                      {editingSkillIndex !== null ? 'Save' : 'Add'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {profileData.skills.length > 0 ? (
                  profileData.skills.map((skill, index) => (
                    <div key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100 group">
                      {skill}
                      <div className="flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditSkill(index, skill)} className="p-1.5 text-purple-500 hover:text-purple-700 mr-1"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteSkill(index)} className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic w-full text-center py-2">Add skills to highlight your expertise</p>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-500" /> Online Presence
                </h3>
              </div>
              <div className="p-6">
                <SocialLinksForm onUpdate={refreshCompletion} />
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-500" /> Resume
              </h3>

              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-purple-50 hover:border-purple-200 transition-colors">
                {profileData.resumeUrl ? (
                  <div className="w-full">
                    <div className="flex items-center justify-center mb-3">
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        <FileText className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2 truncate max-w-full px-2">Resume Uploaded</p>
                    <div className="flex justify-center space-x-3">
                      <a
                        href={profileData.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800 border border-purple-200 px-3 py-1.5 rounded-md hover:bg-purple-50 transition"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Upload your resume (PDF/DOC)</p>
                  </>
                )}

                <label className="mt-3 cursor-pointer">
                  <span className="bg-purple-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-purple-700 transition inline-flex items-center">
                    {uploadingResume ? 'Uploading...' : (profileData.resumeUrl ? 'Replace File' : 'Select File')}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploadingResume}
                  />
                </label>
              </div>
            </div>

          </div>


          {/* RIGHT COLUMN: Metrics, Personal Info Form, Experience, Education (Span 8) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between group">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:text-purple-600 transition-colors">{metrics.applicationsCount}</p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between group">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Upcoming Sessions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:text-purple-600 transition-colors">{metrics.sessionsCount}</p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Basic Info Form */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${fieldErrors.fullName ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="John Doe"
                    />
                    {fieldErrors.fullName && <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="emailAddress"
                      value={profileData.emailAddress}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${fieldErrors.emailAddress ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="john@example.com"
                    />
                    {fieldErrors.emailAddress && <p className="mt-1 text-xs text-red-600">{fieldErrors.emailAddress}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${fieldErrors.phoneNumber ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="+1 (555) 000-0000"
                    />
                    {fieldErrors.phoneNumber && <p className="mt-1 text-xs text-red-600">{fieldErrors.phoneNumber}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${fieldErrors.bio ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Tell recruiters about your background, goals, and expertise..."
                  />
                  {fieldErrors.bio && <p className="mt-1 text-xs text-red-600">{fieldErrors.bio}</p>}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-70 flex items-center"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Experience Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-500" /> Professional Experience
                </h3>
                <button
                  onClick={() => {
                    setShowAddExperience(true);
                    setEditingExperienceIndex(null);
                    setNewExperience({ company: '', startDate: '', endDate: '', description: '', isCurrent: false });
                  }}
                  className="flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>

              {showAddExperience && (
                <div className="p-6 bg-purple-50/30 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-purple-900 mb-4">{editingExperienceIndex !== null ? 'Edit Experience' : 'Add New Experience'}</h4>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        placeholder="Company / Role Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                        <input
                          type="date"
                          value={newExperience.startDate}
                          onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                          className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                        <input
                          type="date"
                          value={newExperience.endDate}
                          onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                          className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:opacity-50 disabled:bg-gray-100"
                          disabled={newExperience.isCurrent}
                        />
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newExperience.isCurrent}
                        onChange={(e) => setNewExperience({ ...newExperience, isCurrent: e.target.checked, endDate: '' })}
                        className="mr-2 h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">I currently work here</span>
                    </label>
                    <textarea
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      rows={3}
                      placeholder="Describe your responsibilities and achievements..."
                    />
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => editingExperienceIndex !== null ? handleUpdateExperience(editingExperienceIndex) : handleAddExperience()}
                        className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        {editingExperienceIndex !== null ? 'Update Experience' : 'Save Experience'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {profileData.experience.length > 0 ? (
                  <div className="space-y-6">
                    {profileData.experience.map((exp, index) => (
                      <div key={index} className="relative pl-8 border-l-2 border-gray-100 last:border-0">
                        <div className="absolute top-0 left-[-9px] h-4 w-4 rounded-full bg-purple-100 border-2 border-purple-500"></div>
                        <div className="flex justify-between items-start group">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 leading-tight">{exp.company}</h4>
                            <p className="text-sm text-purple-600 font-medium mt-1">
                              {new Date(exp.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} - {exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditExperience(index, exp)} className="p-1.5 text-gray-500 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded-md transition"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteExperience(index)} className="p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-md transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-gray-600 mt-2 text-sm leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No experience added</p>
                    <p className="text-gray-400 text-sm mt-1">Showcase your career history</p>
                  </div>
                )}
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-500" /> Education
                </h3>
              </div>
              <div className="p-6">
                <EducationSection onUpdate={refreshCompletion} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerProfile;
