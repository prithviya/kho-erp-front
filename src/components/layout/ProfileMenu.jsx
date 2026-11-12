import {
    User,
    KeyRound,
    CalendarDays,
    LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import { clearSession } from "../../utils/session";

export default function ProfileMenu({
    close,
    onMouseEnter,
    onMouseLeave,
}) {
    const navigate = useNavigate();
    const openProfile = () => {
        close?.();
        navigate("/profile");
    };
    const openUpdatePassword = () => {
        close?.();
        navigate("/profile#password");
    };
    const openTaskSchedule = () => {
        close?.();
        navigate("/task-schedule");
    };
    const logout = async () => {
        try {
            await authService.logout();
        }
        catch {
        }
        clearSession();
        navigate("/");
    };
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
        >
            <button
                type="button"
                onClick={openProfile}
                className="w-full px-5 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
            >
                <User size={18} />
                Profile
            </button>
            <button
                type="button"
                onClick={openUpdatePassword}
                className="w-full px-5 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
            >
                <KeyRound size={18} />
                Update Password
            </button>
            <button
                type="button"
                onClick={openTaskSchedule}
                className="w-full px-5 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
            >
                <CalendarDays size={18} />
                Task Schedule List
            </button>
            
            <hr className="border-slate-200" />
            <button
                type="button"
                onClick={logout}
                className="w-full px-5 py-3 hover:bg-red-50 text-red-500 flex items-center gap-3 text-left transition-colors"
            >
                <LogOut size={18} />
                Logout
            </button>
        </div>
    );
}