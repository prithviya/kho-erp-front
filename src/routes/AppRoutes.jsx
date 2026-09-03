import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../components/loginpage/Login";
import Dashboard from "../components/dashboard/Dashboard";
import LeadOverview from "../components/Lead/LeadOverview";
import Report from "../components/Lead/Report";
import UserManagement from "../components/UserManagement/UserRole";
import Master from "../components/UserManagement/Master";
import Vendor from "../components/Vendor/VendorOverview"
import ProjectOnboarding from "../components/project/onboardingPrjt";
import ProjectDetail from "../components/project/projectDetail";
import TaskBoard from "../components/project/mytask";
import AssignTask from "../components/project/assignTask";
import Applied from "../components/Career/applied";
import JobOpening from "../components/Career/JobOpenings";
import RecruitmentProcess from "../components/Career/recruitmentProcess";
import Onboarding from "../components/Career/onBoarding";
import Employee from "../components/Career/employee";
import Salary from "../components/SalaryPay/Salary";
import Leave from "../components/SalaryPay/leave";
import Cif from "../components/cifForm/ciform";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import { getCurrentUser, getDefaultHomePath } from "../utils/auth";

export default function AppRoutes() {
    const fallbackPath = getDefaultHomePath(getCurrentUser());

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
                path="/cif-form"
                element={
                    <PublicRoute allowAuthenticated>
                        <Cif />
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
                <Route path="/dashboard" element={<RoleRoute roles={["SUPER_ADMIN"]}><Dashboard /></RoleRoute>} />
                <Route path="/lead-overview" element={<RoleRoute roles={["SUPER_ADMIN", "CRM_EXECUTIVE"]}><LeadOverview /></RoleRoute>} />
                <Route path="/report" element={<RoleRoute roles={["SUPER_ADMIN"]}><Report /></RoleRoute>} />
                <Route path="/onboard-prjt" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]}><ProjectOnboarding /></RoleRoute>} />
                <Route path="/prjt-details" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]}><ProjectDetail /></RoleRoute>} />
                <Route path="/tasks" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]}><AssignTask /></RoleRoute>} />
                <Route path="/task-board" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]}><TaskBoard /></RoleRoute>} />
                <Route path="/user-management" element={<RoleRoute roles={["SUPER_ADMIN"]}><UserManagement /></RoleRoute>} />
                <Route path="/master" element={<RoleRoute roles={["SUPER_ADMIN"]}><Master /></RoleRoute>} />
                <Route path="/vendor-overview" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER"]}><Vendor /></RoleRoute>} />
                <Route path="/applied" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]}><Applied /></RoleRoute>} />
                <Route path="/job" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]}><JobOpening /></RoleRoute>} />
                <Route path="/recruitment-process" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]}><RecruitmentProcess /></RoleRoute>} />
                <Route path="/onboarding" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]}><Onboarding /></RoleRoute>} />
                <Route path="/employee" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]}><Employee /></RoleRoute>} />
                <Route path="/payroll" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]}><Salary /></RoleRoute>} />
                <Route path="/leave" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER", "CRM_EXECUTIVE"]}><Leave /></RoleRoute>} />

                <Route path="*" element={<Navigate to={fallbackPath} replace />} />
            </Route>
        </Routes>
    );
}