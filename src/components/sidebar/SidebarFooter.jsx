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
        <div className="border-t border-[#24171a] p-4">
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#251619]">
                    <Shield size={18} className="text-[#d4c6c8]"/>
                </div>
                {
                    !collapsed && (
                        <div>
                            <p className="font-semibold text-sm text-white">
                                {displayName}
                            </p>
                            <p className="text-xs text-[#a99da0]">
                                {role}
                            </p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}