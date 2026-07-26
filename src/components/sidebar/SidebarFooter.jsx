import { Shield } from "lucide-react";
export default function SidebarFooter({ collapsed }) {
    return (
        <div className="border-t border-slate-200 p-4">
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Shield size={18} className="text-orange-600"/>
                </div>
                {
                    !collapsed && (
                        <div>
                            <p className="font-semibold text-sm">
                                Super Admin
                            </p>
                            <p className="text-xs text-slate-500">
                                ERP v1.0
                            </p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}