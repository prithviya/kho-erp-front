import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import SidebarItem from "./SidebarItem";
import menu from "./menu";
import { getMenuIcon } from "./menuIcons";
import userManagementService from "../../services/userManagement.service";
import { hasAnyRole, hasModulePermission, setLivePermissionKeys } from "../../utils/auth";
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

    const [dynamicMenus, setDynamicMenus] = useState(null);
    useEffect(() => {
        let active = true;
        const load = () => userManagementService.getMyMenus()
            .then((response) => {
                if (!active) return;
                const data = response?.data || {};
                setLivePermissionKeys(data.permissionKeys);
                setDynamicMenus(data);
            })
            .catch(() => {});
        load();
        const timer = setInterval(load, 60000);
        window.addEventListener("focus", load);
        window.addEventListener("menus-updated", load);
        return () => {
            active = false;
            clearInterval(timer);
            window.removeEventListener("focus", load);
            window.removeEventListener("menus-updated", load);
        };
    }, []);

    // Admin-managed names/order/enabled state apply to built-in items; admin-created menus are appended.
    const applyDynamicMenus = () => {
        if (!dynamicMenus) return menu;
        const configured = dynamicMenus.menus || [];
        const disabled = new Set(dynamicMenus.disabledRoutes || []);
        const byRoute = new Map(configured.filter((entry) => entry.route).map((entry) => [entry.route, entry]));
        const sections = menu.map((section) => ({
            ...section,
            items: section.items
                .filter((item) => !disabled.has(item.path))
                .map((item) => (byRoute.get(item.path)?.name ? { ...item, name: byRoute.get(item.path).name } : item))
                .sort((a, b) => (byRoute.get(a.path)?.displayOrder ?? 1e6) - (byRoute.get(b.path)?.displayOrder ?? 1e6)),
        }));
        const knownPaths = new Set(menu.flatMap((section) => section.items.map((item) => item.path)));
        const parents = new Map(configured.filter((entry) => !entry.parentId).map((entry) => [entry.id, entry]));
        for (const entry of configured) {
            if (entry.builtIn || !entry.route || knownPaths.has(entry.route)) continue;
            const parentName = String(parents.get(entry.parentId)?.name || "CUSTOM").toUpperCase();
            let section = sections.find((candidate) => candidate.title.toUpperCase() === parentName);
            if (!section) {
                section = { title: parentName, items: [] };
                sections.push(section);
            }
            section.items.push({
                name: entry.name,
                title: entry.name,
                icon: getMenuIcon(entry.icon),
                path: entry.route,
                permissionKey: `${String(entry.code).toLowerCase()}.view`,
                roles: ["DYNAMIC"],
            });
        }
        return sections;
    };

    const visibleMenu = applyDynamicMenus()
        .map((section) => ({
            ...section,
            items: (section.items || []).filter(
                (item) => Array.isArray(item.roles)
                    && item.roles.length > 0
                    && (item.permissionKey
                        ? hasModulePermission(item.permissionKey)
                        : hasAnyRole(item.roles))
            ),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <>
            {/* Mobile Hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                title="Open navigation"
                className="fixed left-4 top-4 z-50 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-lg lg:hidden"
            >
                <Menu size={22} />
            </button>
            {/* Overlay */}
            {
                mobileOpen && (
                    <div
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
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
                <div className="flex-1 px-3 py-2 overflow-auto">
                    {
                        visibleMenu.map(section => (
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