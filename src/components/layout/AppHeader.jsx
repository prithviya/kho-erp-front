import { Menu, Bell, ChevronDown, UserCircle2 } from "lucide-react";
import { useState } from "react";
import ProfileMenu from "./ProfileMenu";
import { getSession } from "../../utils/session";
import { useLocation } from "react-router-dom";
import { getPageTitle } from "../../utils/pageTitle";

export default function AppHeader({
    toggleSidebar
}) {
    const session = getSession();
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const title = getPageTitle(location.pathname);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden"
                    onClick={toggleSidebar}
                >
                    <Menu size={22} />
                </button>
                <h1 className="text-2xl font-semibold text-slate-800">
                    {title}
                </h1>
            </div>
            <div className="flex items-center gap-5">
                <button className="relative">
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