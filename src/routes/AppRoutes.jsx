import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../components/loginpage/Login";
import Dashboard from "../components/dashboard/Dashboard";
import LeadOverview from "../components/Lead/LeadOverview";
import Report from "../components/Lead/Report";
import UserManagement from "../components/UserManagement/UserRole";
import RolePermissions from "../components/UserManagement/RolePermissions";
import MenuPermissionManagement from "../components/UserManagement/MenuPermissionManagement";
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
import Assignedprojectboard from "../components/project/Assignedprojectboard";
import Employee from "../components/Career/employee";
import Salary from "../components/SalaryPay/Salary";
import Leave from "../components/SalaryPay/leave";
import Cif from "../components/cifForm/ciform";
import Profile from "../components/cifForm/profile";
import TaskScheduleList from "../components/project/TaskScheduleList";
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
                <Route path="/dashboard" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]} permissionKey="dashboard.view"><Dashboard /></RoleRoute>} />
                <Route path="/lead-overview" element={<RoleRoute roles={["SUPER_ADMIN", "CRM_EXECUTIVE", "MANAGER"]} permissionKey="lead_management.view"><LeadOverview /></RoleRoute>} />
                <Route path="/report" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]} permissionKey="reports.view"><Report /></RoleRoute>} />
                <Route path="/onboard-prjt" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]} permissionKey="project_onboard.view"><ProjectOnboarding /></RoleRoute>} />
                <Route path="/prjt-details" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]} permissionKey="project_details.view"><ProjectDetail /></RoleRoute>} />
                <Route path="/tasks" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"]} permissionKey="tasks.view"><AssignTask /></RoleRoute>} />
                <Route path="/task-board" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"]} permissionKey="task_board.view"><TaskBoard /></RoleRoute>} />
                <Route path="/task-schedule" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"]} permissionKey="task_schedule.view"><TaskScheduleList /></RoleRoute>} />
                <Route path="/user-management" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]} permissionKey="user_management.view"><UserManagement /></RoleRoute>} />
                <Route path="/role-permissions" element={<RoleRoute roles={["SUPER_ADMIN"]}><RolePermissions /></RoleRoute>} />
                <Route path="/menu-management" element={<RoleRoute roles={["SUPER_ADMIN"]}><MenuPermissionManagement /></RoleRoute>} />
                <Route path="/master" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER"]} permissionKey="master.view"><Master /></RoleRoute>} />
                <Route path="/vendor-overview" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER"]} permissionKey="vendor_management.view"><Vendor /></RoleRoute>} />
                <Route path="/applied" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]} permissionKey="applied.view"><Applied /></RoleRoute>} />
                <Route path="/job" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]} permissionKey="opening.view"><JobOpening /></RoleRoute>} />
                <Route path="/assign-board" element={<RoleRoute roles={["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"]} permissionKey="assign_board.view"><Assignedprojectboard /></RoleRoute>} />
                <Route path="/recruitment-process" element={<RoleRoute roles={["SUPER_ADMIN", "HR"]} permissionKey="recruitment.view"><RecruitmentProcess /></RoleRoute>} />
                <Route path="/onboarding" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER"]} permissionKey="onboarding.view"><Onboarding /></RoleRoute>} />
                <Route path="/employee" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER"]} permissionKey="employee.view"><Employee /></RoleRoute>} />
                <Route path="/payroll" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER"]} permissionKey="payroll_management.view"><Salary /></RoleRoute>} />
                <Route path="/leave" element={<RoleRoute roles={["SUPER_ADMIN", "HR", "MANAGER", "CRM_EXECUTIVE", "CEO", "TEAM_MEMBER"]} permissionKey="leave.view"><Leave /></RoleRoute>} />
                <Route path="/profile" element={<Profile />} />

                <Route path="*" element={<Navigate to={fallbackPath} replace />} />
            </Route>
        </Routes>
    );
}