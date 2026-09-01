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
    HandCoins,
    FileUser,
    Network,
    RotateCwSquare
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
                roles: ["SUPER_ADMIN", "CRM_EXECUTIVE"]
            },
            {
                name: "Reports",
                title: "Report Overview",
                icon: ChartNoAxesCombined,
                path: "/report",
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
                roles: ["SUPER_ADMIN", "MANAGER"]
            },
            {
                name: "Project details",
                title: "Project details",
                icon: Waypoints,
                path: "/prjt-details",
                roles: ["SUPER_ADMIN", "MANAGER"]
            },
            {
                name: "Work Allocation",
                title: "Assign Task",
                icon: ClipboardCheck,
                path: "/tasks",
                roles: ["SUPER_ADMIN", "MANAGER"]
            },
            {
                name: "Task Board",
                title: "Task Board",
                icon: ClipboardCheck,
                path: "/task-board",
                roles: ["SUPER_ADMIN", "MANAGER"]
            }
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
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Applied",
                title: "job Applied",
                icon: Split,
                path: "/applied",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Recruitment",
                title: "Recruitment Process",
                icon: UserPlus,
                path: "/recruitment-process",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Onboarding",
                title: "Onboarding",
                icon: BadgeCheck,
                path: "/onboarding",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Employee",
                title: "Employee",
                icon: Puzzle,
                path: "/employee",
                roles: ["SUPER_ADMIN", "HR"]
            }
        ]
    },
    {
        title: "PAYROLL",
        items: [
            {
                name: "Payroll",
                title: "Payroll",
                icon: HandCoins,
                path: "/payroll",
                roles: ["SUPER_ADMIN", "HR"]
            },
            {
                name: "Leave",
                title: "Leave",
                icon: Users,
                path: "/leave",
                roles: ["SUPER_ADMIN", "HR", "MANAGER", "CRM_EXECUTIVE"]
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
                roles: ["SUPER_ADMIN"]
            },
            {
                name: "Master",
                title:"Master Setting",
                icon: Network,
                path:"/master",
                roles:["SUPER_ADMIN"]
            },
            {
                name: "Ventor Management",
                title: "Ventor Management",
                icon: RotateCwSquare,
                path: "/ventor-management",
                roles: ["SUPER_ADMIN", "MANAGER"]
            },
            {
                name: "Ventor Assigned",
                title: "Ventor Assigned",
                icon: RotateCwSquare,   
                path: "/ventor-assigned",
                roles: ["SUPER_ADMIN", "MANAGER"]
            },
            {
                name: "CIF Form",
                title: "CIF Form",
                icon: FileUser,
                path: "/cif-form",
                roles: ["SUPER_ADMIN"]
            }
        ]
    }
];
export default menu;