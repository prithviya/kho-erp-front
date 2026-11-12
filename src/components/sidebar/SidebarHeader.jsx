import { Menu, ChevronLeft } from "lucide-react";

export default function SidebarHeader({ collapsed, toggleSidebar, mobileOpen, setMobileOpen }) {
    return (
        <div className="h-[68px] shrink-0 flex items-center justify-between px-4 p-2">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full bg-[#9c1018] text-[6px] font-extrabold leading-[7px] tracking-wide text-white">
                    <span>KHO</span>
                    <span>SOCIAL</span>
                </div>
                {!collapsed && (
                    <div>
                        <h2 className="text-sm font-semibold tracking-tight text-white">
                            Kho ERP
                        </h2>
                    </div>
                )}
            </div>
            {/* Desktop Collapse */}
            <button
                onClick={toggleSidebar}
                className="hidden lg:flex w-8 h-8 rounded-lg hover:bg-[#251619] text-[#b8adaf] items-center justify-center transition-colors"
            >
                {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
            {/* Mobile Close */}
            {
                mobileOpen &&
                <button
                    className="lg:hidden text-[#b8adaf]"
                    title="Close navigation"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                >
                    <ChevronLeft size={22} />
                </button>
            }
        </div>
    );
}