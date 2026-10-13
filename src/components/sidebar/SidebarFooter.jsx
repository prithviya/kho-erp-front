import { Shield } from "lucide-react";
import { getCanonicalRoles, getCurrentUser } from "../../utils/auth";

const formatRole = (role = "TEAM_MEMBER") => role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export default function SidebarFooter({ collapsed }) {
    const user = getCurrentUser() || {};
    const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
    const role = formatRole(getCanonicalRoles(user)[0] || user.role || "TEAM_MEMBER");

    return (
        <div className="border-t border-slate-200 p-4">
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <Shield size={18} className="text-emerald-600"/>
                </div>
                {
                    !collapsed && (
                        <div>
                            <p className="font-semibold text-sm">
                                {displayName}
                            </p>
                            <p className="text-xs text-slate-500">
                                {role}
                            </p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}