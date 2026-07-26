import { Menu, ChevronLeft } from "lucide-react";
import { BsCpuFill } from "react-icons/bs";

export default function SidebarHeader({ collapsed, toggleSidebar, mobileOpen, setMobileOpen }) {
    return (
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
                <BsCpuFill className="w-10 h-10 text-blue-500" />
                {!collapsed && (
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg">
                            Kho ERP
                        </h2>
                        <p className="text-xs text-slate-500">
                            Enterprise ERP
                        </p>
                    </div>
                )}
            </div>
            {/* Desktop Collapse */}
            <button
                onClick={toggleSidebar}
                className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-slate-100 items-center justify-center"
            >
                {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
            {/* Mobile Close */}
            {
                mobileOpen &&
                <button
                    className="lg:hidden"
                    onClick={() => setMobileOpen(false)}
                >
                    <ChevronLeft size={22} />
                </button>
            }
        </div>
    );
}