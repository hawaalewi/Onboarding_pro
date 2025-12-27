// src/components/OrganizationDashboard.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, User, FileText, Calendar, Zap, Bell, MessageSquare, Building2 } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../context/NotificationContext';

const navLinks = [
  { name: 'Dashboard', path: '', icon: LayoutDashboard },
  { name: 'Profile', path: 'profile', icon: User },
  { name: 'Sessions', path: 'sessions', icon: Zap },
  { name: 'Applications', path: 'applications', icon: FileText },
  { name: 'Calendar', path: 'calendar', icon: Calendar },
  { name: 'Feedback', path: 'feedback', icon: MessageSquare },
  { name: 'Notifications', path: 'notifications', icon: Bell },
];

const OrganizationDashboard = () => {
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
    return name ? name.charAt(0).toUpperCase() : 'O';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">

      {/* LEFT SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-indigo-800">
              OnBoard
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.name === 'Dashboard'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mx-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <link.icon className="w-5 h-5 mr-3" />
              <span className="flex-1">{link.name}</span>
              {link.name === 'Notifications' && unreadCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="min-h-full">

          {/* TOP HEADER */}
          <header className="sticky top-0 z-30 flex justify-end items-center px-8 py-5 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
            <div className="flex items-center space-x-6">
              <NotificationBell />
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3 pl-2">
                <div className='text-right hidden sm:block'>
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.companyInfo?.companyName || 'Organization'}
                  </p>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">Organization Account</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold overflow-hidden shadow-sm ring-2 ring-white">
                  {user?.companyInfo?.logoUrl ? (
                    <img
                      src={user.companyInfo.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : (
                    getInitials(user?.companyInfo?.companyName)
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="flex">
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrganizationDashboard;

