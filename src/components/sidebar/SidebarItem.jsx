import { useLocation, useNavigate } from "react-router-dom";
import { hasAnyRole, hasModulePermission } from "../../utils/auth";

export default function SidebarItem({
    item,
    collapsed,
    mobileClose
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const Icon = item.icon;
    const active = location.pathname === item.path;
    const canAccess = Array.isArray(item.roles)
        && item.roles.length > 0
        && (item.permissionKey
            ? hasModulePermission(item.permissionKey)
            : hasAnyRole(item.roles));

    if (!canAccess) {
        return null;
    }

    const handleClick = () => {
        if (!item.path) return;
        if (/^https?:\/\//i.test(item.path)) {
            window.open(item.path, "_blank", "noopener,noreferrer");
        } else {
            navigate(item.path);
        }
        if (mobileClose) {
            mobileClose(false);
        }
    };
    return (
        <button
            onClick={handleClick}
            className={`
            group
            relative
            w-full
            flex
            items-center
            ${collapsed ? "justify-center" : "justify-start"}
            gap-3
            px-3
            py-2
            rounded-lg
            transition-all
            duration-200
            ${active
                    ? "bg-[#8f1018] text-white"
                    : "text-[#b8adaf] hover:bg-[#251619] hover:text-white"}
            `}
        >
            <Icon
                size={19}
                strokeWidth={2}
                className={`shrink-0 ${active ? "text-[#f4d184]" : ""}`}
            />
            {
                !collapsed &&
                <>
                    <span className="text-sm font-normal flex-1 text-left">
                        {item.name}
                    </span>
                    {
                        item.badge &&
                        <span
                            className="
                            bg-red-500
                            text-white
                            text-[10px]
                            px-2
                            py-0.5
                            rounded-full
                            font-semibold
                            "
                        >
                            {item.badge}
                        </span>
                    }
                </>
            }
            {
                collapsed &&
                <div
                    className="
                    absolute
                    left-16
                    z-50
                    invisible
                    opacity-0
                    group-hover:visible
                    group-hover:opacity-100
                    transition-all
                    duration-200
                    bg-[#2b1d20]
                    text-white
                    text-xs
                    rounded-lg
                    px-3
                    py-2
                    whitespace-nowrap
                    shadow-lg
                    "
                >
                    {item.name}
                </div>
            }
        </button>
    );
}