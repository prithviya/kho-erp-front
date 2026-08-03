import { Routes, Route } from "react-router-dom";
import Login from "../components/loginpage/Login";
import Dashboard from "../components/dashboard/Dashboard";
import LeadOverview from "../components/Lead/LeadOverview";
import Report from "../components/Lead/Report";
import UserManagement from "../components/UserManagement/UserRole";
import Master from "../components/UserManagement/Master";
import VentorManagement from "../components/Ventor/ventorOverview";
import VentorAssigned from "../components/Ventor/ventorAssigned";
import ProjectOnboarding from "../components/project/onboardingPrjt";
import ProjectDetail from "../components/project/projectDetail";
import AssignTask from "../components/project/assignTask";
import JobOpening from "../components/Career/job";
import RecruitmentProcess from "../components/Career/recruitmentProcess";
import Onboarding from "../components/Career/onboarding";
import Employee from "../components/Career/employee";
import Salary from "../components/SalaryPay/Salary";
import Leave from "../components/SalaryPay/leave";
import Cif from "../components/cifForm/ciform";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            <Route
                element={
                    <PrivateRoute>
                        <MainLayout />
                    </PrivateRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/lead-overview" element={<LeadOverview />} />
                <Route path="/report" element={<Report />} />
                <Route path="/onboard-prjt" element={<ProjectOnboarding />} />
                <Route path="/prjt-details" element={<ProjectDetail />} />
                <Route path="/tasks" element={<AssignTask />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/master" element={<Master/>} />
                <Route path="/ventor-management" element={<VentorManagement />} />
                <Route path="/ventor-assigned" element={<VentorAssigned />} />
                <Route path="/cif-form" element={<Cif />} />
                <Route path="/job" element={<JobOpening />} />
                <Route path="/recruitment-process" element={<RecruitmentProcess />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/employee" element={<Employee />} />
                <Route path="/payroll" element={<Salary />} />
                <Route path="/leave" element={<Leave />} />
            </Route>
        </Routes>
    );
}