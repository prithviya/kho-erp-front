import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import SidebarItem from "./SidebarItem";
import menu from "./menu";
export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    // Responsive
    useEffect(() => {
        const resize = () => {
            if (window.innerWidth < 768) {
                setCollapsed(false);
            }
            else if (window.innerWidth < 1024) {
                setCollapsed(true);
            }
            else {
                setCollapsed(false);
            }
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);
    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };
    return (
        <>
            {/* Mobile Hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-lg shadow-md p-2"
            >
                <Menu size={22} />
            </button>
            {/* Overlay */}
            {
                mobileOpen && (
                    <div
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    />
                )
            }
            <aside
                className={`
                fixed
                lg:relative
                z-50
                top-0
                left-0
                h-screen
                bg-white
                border-r
                border-slate-200
                flex
                flex-col
                transition-all
                duration-300
                ${
                    mobileOpen
                        ?
                        "translate-x-0"
                        :
                        "-translate-x-full lg:translate-x-0"
                }
                ${
                    collapsed
                        ?
                        "lg:w-20"
                        :
                        "w-64"
                }
                `}
            >
                <SidebarHeader
                    collapsed={collapsed}
                    toggleSidebar={toggleSidebar}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />
                {/* Menu */}
                <div className="flex-1 px-3 py-2">
                    {
                        menu.map(section => (
                            <div
                                key={section.title}
                                className="mb-5"
                            >
                                {
                                    !collapsed && (
                                        <h4
                                            className="
                                            text-[11px]
                                            uppercase
                                            tracking-[0.18em]
                                            text-slate-400
                                            font-semibold
                                            px-3
                                            mb-2
                                            "
                                        >
                                            {section.title}
                                        </h4>
                                    )
                                }
                                <div className="space-y-1">
                                    {
                                        section.items.map(item => (
                                            <SidebarItem
                                                key={item.name}
                                                item={item}
                                                collapsed={collapsed}
                                                mobileClose={setMobileOpen}
                                            />
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    }
                </div>
                <SidebarFooter
                    collapsed={collapsed}
                />
            </aside>
        </>
    );
}