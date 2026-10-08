import { Menu, ChevronLeft } from "lucide-react";
import { Building2 } from "lucide-react";

export default function SidebarHeader({ collapsed, toggleSidebar, mobileOpen, setMobileOpen }) {
    return (
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 p-2">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Building2 size={21} strokeWidth={2.2} />
                </div>
                {!collapsed && (
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-800">
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