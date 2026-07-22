import {
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  KanbanSquare,
  ClipboardCheck,
  Briefcase,
  UserPlus,
  BadgeCheck,
  FileUser,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/kho.webp";

const menu = [
  {
    title: "MAIN",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        name: "Lead Management",
        icon: Users,
        path: "/lead-overview",
      },

      {
        name: "Report",
        icon: ChartNoAxesCombined,
        path: "/report",
      },
    ],
  },
  {
    title: "PROJECT",
    items: [
      {
        name: "Project on Board",
        icon: KanbanSquare,
      },
      {
        name: "Assign Task",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "SYSTEM ADMIN",
    items: [
      {
        name: "User Management",
        icon: Users,
        path: "/user-management",
      },
      {
        name: "CIF Form",
        icon: Users,
        path: "/cif-form",
      }
    ],
  },
  {
    title: "CAREER",
    items: [
      {
        name: "Opening",
        icon: Briefcase,
        path: '/job-opening',
      },
      {
        name: "Job Applications",
        icon: FileUser,
        path: '/job-applications',
      },
      {
        name: "Recruitment",
        icon: UserPlus,
      },
      {
        name: "Onboarding",
        icon: BadgeCheck,
      },
      {
        name: "Employee Management",
        icon: Users,
      },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-72 h-screen bg-white border-r-1 border-r-gray-400 flex flex-col justify-between">
      <div className="border-b border-gray-400 py-4 font-semibold text-center text-black-600 text-2xl">
        <img src={logo} alt="Company Logo" className="mx-auto" style={{width: '100px', height: '50px' }}/>
      </div>
      <div className="p-5 overflow-y-auto">
        {menu.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="text-xs font-bold tracking-[2px] text-gray-400 mb-4">
              {section.title}
            </h3>

            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path && location.pathname === item.path;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    disabled={!item.path}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-orange-50 text-orange-500"
                        : "text-gray-800 hover:bg-gray-100"
                    } ${!item.path ? "cursor-not-allowed opacity-50" : ""}`}>
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t py-4 text-center text-gray-400 text-sm">
        ERP v1.0
      </div>
    </aside>
  );
}
