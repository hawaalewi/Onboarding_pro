import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import JobSeekerDashboard from './components/JobSeekerDashboard';
import DashboardOverview from './pages/jobseeker/DashboardOverview';
import JobSeekerProfile from './pages/jobseeker/JobSeekerProfile';
import SessionDiscovery from './pages/jobseeker/SessionDiscovery';
import SessionDetails from './pages/jobseeker/SessionDetails';
import Wishlist from './pages/jobseeker/Wishlist';
import Applications from './pages/jobseeker/Applications';
import OrganizationDashboard from './components/OrganizationDashboard';
import OrganizationDashboardOverview from './pages/organization/DashboardOverview';
import SessionsManagement from './pages/organization/SessionsManagement';
import ApplicationsManagement from './pages/organization/ApplicationsManagement';
import Notifications from './pages/Notifications';
import OrganizationProfile from './pages/organization/OrganizationProfile';
import ProtectedRoute from './components/ProtectedRoute';
// Pages
import ChooseRole from "./pages/ChooseRole";
import RegisterJobSeeker from "./pages/RegisterJobSeeker";
import Login from "./pages/Login";
import RegisterOrganization from "./pages/RegisterOrganization";
import PublicOrganizationProfile from "./pages/PublicOrganizationProfile";
import PublicJobSeekerProfile from './pages/jobseeker/PublicJobSeekerProfile';
// Optional: Simple Layout component
const Layout = ({ children }) => (
  <div className="min-h-screen bg-gray-100">{children}</div>
);

import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<ChooseRole />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/job_seeker" element={<RegisterJobSeeker />} />
            <Route path="/register/organization" element={<RegisterOrganization />} />
            <Route path="/organization/public/:id" element={<PublicOrganizationProfile />} />
            <Route path="/jobseeker/public/:id" element={<PublicJobSeekerProfile />} />

            {/* JOB SEEKER DASHBOARD ROUTES (Protected) */}
            <Route path="/dashboard/job_seeker" element={<ProtectedRoute><JobSeekerDashboard /></ProtectedRoute>}>
              {/* Nested Routes */}
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<JobSeekerProfile />} />
              <Route path="sessions" element={<SessionDiscovery />} />
              <Route path="sessions/:id" element={<SessionDetails />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="applications" element={<Applications />} />
            </Route>

            {/* ORGANIZATION DASHBOARD ROUTES (Protected) */}
            <Route path="/dashboard/organization" element={<ProtectedRoute><OrganizationDashboard /></ProtectedRoute>}>
              {/* Nested Routes */}
              <Route index element={<OrganizationDashboardOverview />} />
              <Route path="profile" element={<OrganizationProfile />} />
              <Route path="sessions" element={<SessionsManagement />} />
              <Route path="applications" element={<ApplicationsManagement />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </NotificationProvider>
  );
}

export default App;
