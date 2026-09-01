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
        <div className="flex h-screen bg-slate-50">
            {!isCifForm && (
                <Sidebar
                    mobileOpen={mobileSidebar}
                    setMobileOpen={setMobileSidebar}
                />
            )}
            <div className="flex flex-col flex-1 overflow-hidden">
                <AppHeader
                    toggleSidebar={isCifForm ? undefined : () => setMobileSidebar(true)}
                    hideSidebarToggle={isCifForm}
                />
                <main className="min-h-0 flex-1 overflow-y-auto">
                    <Outlet />
                </main>
                <Chatbot/>
            </div>
        </div>
    );
}