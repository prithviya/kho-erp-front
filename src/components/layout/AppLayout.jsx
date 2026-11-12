import Sidebar from "../sidebar/Sidebar";
import AppHeader from "./AppHeader";
import Chatbot from "./chatbot"
import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
export default function AppLayout() {
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const { pathname } = useLocation();
    const isCifForm = pathname === "/cif-form";

    return (
        <div className="flex h-dvh min-h-screen min-w-0 overflow-hidden bg-slate-50 text-slate-800">
            {!isCifForm && (
                <Sidebar
                    mobileOpen={mobileSidebar}
                    setMobileOpen={setMobileSidebar}
                />
            )}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <AppHeader
                    toggleSidebar={isCifForm ? undefined : () => setMobileSidebar(true)}
                    hideSidebarToggle={isCifForm}
                />
                <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
                    <Outlet />
                </main>
                <Chatbot/>
            </div>
        </div>
    );
}