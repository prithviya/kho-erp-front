import { Menu, Bell, ChevronDown, UserCircle2 } from "lucide-react";
import { useState } from "react";
import ProfileMenu from "./ProfileMenu";
import { getSession } from "../../utils/session";
import { useLocation } from "react-router-dom";
import { getPageTitle } from "../../utils/pageTitle";

export default function AppHeader({
    toggleSidebar,
    hideSidebarToggle = false
}) {
    const session = getSession();
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const title = getPageTitle(location.pathname);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-4">
                {!hideSidebarToggle && (
                    <button
                        aria-label="Open navigation"
                        className="lg:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu size={22} />
                    </button>
                )}
                <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-5">
                <button aria-label="Notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                    <Bell size={21} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
                </button>
                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-3"
                    >
                        <UserCircle2
                            size={38}
                            className="text-slate-500"
                        />
                        <div className="hidden md:block text-left">
                            <p className="font-semibold">
                                {session?.user?.firstName || "Super Admin"}
                            </p>
                            <p className="text-xs text-slate-500">
                                {session?.user?.roles?.[0]?.name || "Administrator"}
                            </p>
                        </div>
                        <ChevronDown size={18} />
                    </button>
                    {
                        open &&
                        <ProfileMenu
                            close={() => setOpen(false)}
                        />
                    }
                </div>
            </div>
        </header>
    );
}