import {
    LayoutDashboard,
    Users,
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
                roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"]
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
                roles: ["SUPER_ADMIN", "ADMIN"]
            },
            {
                name: "Reports",
                title: "Report Overview",
                icon: ChartNoAxesCombined,
                path: "/report",
                roles: ["SUPER_ADMIN", "ADMIN"]
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
                roles: ["SUPER_ADMIN", "ADMIN"]
            },
            {
                name: "Project details",
                title: "Project details",
                icon: Waypoints,
                path: "/prjt-details",
                roles: ["SUPER_ADMIN", "ADMIN"]
            },
            {
                name: "Work Allocation",
                title: "Assign Task",
                icon: ClipboardCheck,
                path: "/tasks",
                roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"],
                badge: 5
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
                name: "CIF Form",
                title: "CIF Form",
                icon: FileUser,
                path: "/cif-form",
                roles: ["SUPER_ADMIN"]
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
                path: "/job"
            },
            {
                name: "Recruitment",
                title: "Recruitment Process",
                icon: UserPlus,
                path: "/recruitment-process"
            },
            {
                name: "Onboarding",
                title: "Onboarding",
                icon: BadgeCheck,
                path: "/onboarding"
            },
            {
                name: "Employee",
                title: "Employee",
                icon: Puzzle,
                path: "/employee"
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
                path: "/payroll"
            },
            {
                name: "Leave",
                title: "Leave",
                icon: Users,
                path: "/leave"
            }
        ]
    }
    
];
export default menu;