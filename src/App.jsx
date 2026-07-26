import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import Login from './components/loginpage/Login';
import Dashboard from './components/dashboard/Dashboard';
import Sidebar from './components/sidebar/Sidebar';
import LeadOverview from './components/Lead/LeadOverview';
import Report from './components/Lead/Report';

import UserManagement from './components/UserManagement/UserRole';

import Cif from './components/cifForm/ciform';

import JobOpening from './components/Career/job';
import RecruitmentProcess from './components/Career/recruitmentProcess';
import Onboarding from './components/Career/onboarding';
import Employee from './components/Career/employee';
import Salary from './components/SalaryPay/Salary';
import Leave from './components/SalaryPay/leave';
import ProjectOnboarding from './components/project/onboardingPrjt';
import Project from './components/project/projectDetail';
function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-grey-100 min-h-screen">
          <Routes>
            <Route path="/dashboard" element={<Navigate to="/dashboard"  />} />
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lead-overview" element={<LeadOverview />} />
            <Route path="/report" element={<Report />} />

            <Route path="/onboard-prjt" element={<ProjectOnboarding />} />
            <Route path="/project-overview" element={<Project />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/cif-form" element={<Cif />} />

            <Route path="/job" element={<JobOpening />} />
            <Route path="/recruitment-process" element={<RecruitmentProcess />} />
            <Route path="/onboarding" element={<Onboarding/>} />
            <Route path="/employee" element={<Employee/>} />

            <Route path="/payroll" element={<Salary />} />
            <Route path="/leave" element={<Leave />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
