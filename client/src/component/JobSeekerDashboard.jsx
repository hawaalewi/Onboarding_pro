// src/components/JobSeekerDashboard.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, User, FileText, Calendar, Zap, Bell, Heart } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';

const navLinks = [
  { name: 'Dashboard', path: '', icon: LayoutDashboard },
  { name: 'Profile', path: 'profile', icon: User },
  { name: 'Sessions', path: 'sessions', icon: Zap },
  { name: 'Wishlist', path: 'wishlist', icon: Heart },
  { name: 'Applications', path: 'applications', icon: FileText },
  { name: 'Calendar', path: 'calendar', icon: Calendar },
  { name: 'Notifications', path: 'notifications', icon: Bell },
];

const JobSeekerDashboard = () => {
  const { unreadCount } = useNotifications();
  const activeClass = "bg-purple-100 text-purple-700 font-semibold";
  const defaultClass = "text-gray-600 hover:bg-gray-50";

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'J';
  };

  const displayName = user?.personalInfo?.fullName || user?.email?.split('@')[0] || 'Job Seeker';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">

      {/* LEFT SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-20">
        <div className="p-8 pb-8 flex items-center space-x-3">
          <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-200">
            <Zap className="w-6 h-6 text-white text-bold" strokeWidth={3} />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-600 tracking-tight">OnBoard</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              // Use end property to match index route precisely
              end={link.name === 'Dashboard'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-purple-50 text-purple-700 font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`
              }
            >
              <link.icon className={`w-5 h-5 mr-3 transition-colors ${({ isActive }) => isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="flex-1 text-sm tracking-wide">{link.name}</span>
              {link.name === 'Notifications' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Main Content Wrapper */}
        <div className="min-h-full">

          {/* TOP HEADER */}
          {/* TOP HEADER */}
          <header className="flex justify-between items-center px-8 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-100/50 sticky top-0 z-10 transition-all duration-200">
            <div className="flex-1">
              {/* Placeholder for Breadcrumbs or Page Title if needed later */}
            </div>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <NotificationBell />
              </div>
              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              <div className="flex items-center gap-4 pl-2 cursor-pointer group">
                <div className='text-right hidden sm:block'>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">Job Seeker</p>
                </div>
                <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-50 p-0.5 shadow-sm group-hover:shadow-md transition-all ring-2 ring-white ring-offset-2 ring-offset-purple-50">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user?.personalInfo?.profilePhotoUrl ? (
                      <img
                        src={user.personalInfo.profilePhotoUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : (
                      <span className="text-purple-600 font-bold text-lg">{getInitials(displayName)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT RENDERS HERE */}
          {/* RIGHT SIDEBAR (Filters/Notifications - conditionally rendered) */}
          {/* NOTE: You should conditionally render the Filter component only on the Sessions page */}
          {/* Placeholder for Filters / Latest Notifications shown on Dashboard */}
          <div className="flex">
            <div className="flex-1 ">
              <Outlet />
            </div>


            {/* <aside className="w-64">
              
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter</h3>
              <div className="space-y-4">
                
                <h4 className="font-medium text-sm text-gray-700">Latest Notifications</h4>
                <ul className="text-sm space-y-2">
                  <li className="text-gray-600">New message from Organization X.</li>
                  <li className="text-gray-600">Your application for API Workshop was approved!</li>
                </ul>
              </div>
            </aside> */}
          </div>

        </div>
      </main>
    </div>
  );
};

export default JobSeekerDashboard;