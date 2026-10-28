import {
    LayoutDashboard,
    Users, Split,
    ChartNoAxesCombined,
    KanbanSquare,
    Waypoints,
    ClipboardCheck,
    Briefcase,
    UserPlus,
    BadgeCheck,
    Puzzle,
    WalletCards,
    FileUser,
    Network,
    RotateCwSquare,
    ShieldCheck,
    ListTree
} from "lucide-react";
const menu = [
    {
        title: "MAIN",
        items: [
            {
                name: "Dashboard",
                title: "Dashboard Overview",
                icon: LayoutDashboard,
                path: "/dashboard",
                permissionKey: "dashboard.view",
                roles: ["SUPER_ADMIN"]
            }
        ]
    },
    {
        title: "CRM",
        items: [
            {
                name: "Lead Management",
                title: "Lead Overview",
                icon: Users,
                path: "/lead-overview",
                permissionKey: "lead_management.view",
                roles: ["SUPER_ADMIN", "CRM_EXECUTIVE"]
            },
            {
                name: "Reports",
                title: "Report Overview",
                icon: ChartNoAxesCombined,
                path: "/report",
                permissionKey: "reports.view",
                roles: ["SUPER_ADMIN"]
            }
        ]
    },
    {
        title: "PROJECT",
        items: [
            {
                name: "Project Onboard",
                title: "Project Onboarding",
                icon: KanbanSquare,
                path: "/onboard-prjt",
                permissionKey: "project_onboard.view",
                roles: ["SUPER_ADMIN"]
            },
            {
                name: "Project details",
                title: "Project details",
                icon: Waypoints,
                path: "/prjt-details",
                permissionKey: "project_details.view",
                roles: ["SUPER_ADMIN", "MANAGER"]
            },
            // {
            //     name: "Work Allocation",
            //     title: "Assign Task",
            //     icon: ClipboardCheck,
            //     path: "/tasks",
            //     roles: ["SUPER_ADMIN", "MANAGER"]
            // },
            // {
            //     name: "Task Board",
            //     title: "My Tasks",
            //     icon: ClipboardCheck,
            //     path: "/task-board",
            //     roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"]
            // },
            {
                name: "Assign board",
                title: "My Tasks Assign board",
                icon: ClipboardCheck,
                path: "/assign-board",
                permissionKey: "assign_board.view",
                roles: ["SUPER_ADMIN", "MANAGER", "CRM_EXECUTIVE", "HR", "CEO", "TEAM_MEMBER"]
            },
        ]
    },
    
    {
        title: "HRM",
        items: [
            {
                name: "Opening",
                title: "Job Opening",
                icon: Briefcase,
                path: "/job",
                permissionKey: "opening.view",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Applied",
                title: "job Applied",
                icon: Split,
                path: "/applied",
                permissionKey: "applied.view",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Recruitment",
                title: "Recruitment Process",
                icon: UserPlus,
                path: "/recruitment-process",
                permissionKey: "recruitment.view",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Onboarding",
                title: "Onboarding",
                icon: BadgeCheck,
                path: "/onboarding",
                permissionKey: "onboarding.view",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Employee",
                title: "Employee",
                icon: Puzzle,
                path: "/employee",
                permissionKey: "employee.view",
                roles: ["SUPER_ADMIN", "HR" ]
            }
        ]
    },
    {
        title: "PAYROLL",
        items: [
            {
                name: "Payroll",
                title: "Payroll",
                icon: WalletCards,
                path: "/payroll",
                permissionKey: "payroll_management.view",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Leave",
                title: "Leave",
                icon: Users,
                path: "/leave",
                permissionKey: "leave.view",
                roles: ["SUPER_ADMIN", "HR", "CRM_EXECUTIVE", "CEO", "TEAM_MEMBER","MANAGER"]
            }
        ]
    },
    {
        title: "SYSTEM ADMIN",
        items: [
            {
                name: "User Management",
                title: "User Management",
                icon: Users,
                path: "/user-management",
                permissionKey: "user_management.view",
                roles: ["SUPER_ADMIN"]
            },
            {
                name: "Roles & Permissions",
                title: "Manage roles and module permissions",
                icon: ShieldCheck,
                path: "/role-permissions",
                roles: ["SUPER_ADMIN"]
            },
            {
                name: "Menu & Permissions",
                title: "Menu & Permission Management",
                icon: ListTree,
                path: "/menu-management",
                roles: ["SUPER_ADMIN"]
            },
            {
                name: "Master",
                title:"Master Setting",
                icon: Network,
                path:"/master",
                permissionKey: "master.view",
                roles:["SUPER_ADMIN"]
            },
            {
                name: "Ventor Management",
                title: "Ventor Management",
                icon: RotateCwSquare,
                path: "/vendor-overview",
                permissionKey: "vendor_management.view",
                roles: ["SUPER_ADMIN", "HR"]
            },
            // {
            //     name: "Ventor Assigned",
            //     title: "Ventor Assigned",
            //     icon: RotateCwSquare,   
            //     path: "/ventor-assigned",
            //     roles: ["SUPER_ADMIN"]
            // },
            {
                name: "CIF Form",
                title: "CIF Form",
                icon: FileUser,
                path: "/cif-form",
                permissionKey: "cif_form.view",
                roles: ["SUPER_ADMIN"]
            }
        ]
    }
];
export default menu;