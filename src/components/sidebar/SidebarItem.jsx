import { useLocation, useNavigate } from "react-router-dom";
import { hasAnyRole } from "../../utils/auth";

export default function SidebarItem({
    item,
    collapsed,
    mobileClose
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const Icon = item.icon;
    const active = location.pathname === item.path;
    const canAccess = Array.isArray(item.roles) && item.roles.length > 0 && hasAnyRole(item.roles);

    if (!canAccess) {
        return null;
    }

    const handleClick = () => {
        if (!item.path) return;
        navigate(item.path);
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
            py-2.5
            rounded-xl
            transition-all
            duration-200
            ${active
                    ? "bg-orange-100 text-orange-600 border-l-4 border-orange-500 shadow-sm"
                    : "hover:bg-slate-100 text-slate-700"}
            `}
        >
            <Icon
                size={19}
                strokeWidth={2}
                className="shrink-0"
            />
            {
                !collapsed &&
                <>
                    <span className="text-sm font-medium flex-1 text-left">
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
                    bg-slate-900
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