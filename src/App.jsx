import React from 'react';
import Login from './components/loginpage/Login';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/sidebar/Sidebar';
import LeadOverview from './components/Lead/LeadOverview';
import Report from './components/Lead/Report';

import UserManagement from './components/UserManagement/UserRole';

import Cif from './components/cifForm/ciform';

import JobOpening from './components/Career/job';

import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-grey-100 min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lead-overview" element={<LeadOverview />} />
            <Route path="/report" element={<Report />} />

            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/cif-form" element={<Cif />} />

            <Route path="/job-opening" element={<JobOpening />} />

          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
