import Sidebar from "../sidebar/Sidebar";
import AppHeader from "./AppHeader";
import Chatbot from "./chatbot"
import { Outlet } from "react-router-dom";
import { useState } from "react";
export default function AppLayout() {
    const [mobileSidebar, setMobileSidebar] = useState(false);
    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar
                mobileOpen={mobileSidebar}
                setMobileOpen={setMobileSidebar}
            />
            <div className="flex flex-col flex-1 overflow-hidden">
                <AppHeader
                    toggleSidebar={() => setMobileSidebar(true)}
                />
                <main className="flex-1 p-3">
                    <Outlet />
                </main>
                <Chatbot/>
            </div>
        </div>
    );
}