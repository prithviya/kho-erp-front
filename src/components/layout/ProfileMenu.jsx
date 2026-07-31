import {
    User,
    Settings,
    LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/auth.service";
import { clearSession } from "../../utils/session";
export default function ProfileMenu({
    close
}) {
    const navigate = useNavigate();
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
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <button
                className="w-full px-5 py-3 hover:bg-slate-50 flex items-center gap-3"
            >
                <User size={18} />
                Profile
            </button>
            <button
                className="w-full px-5 py-3 hover:bg-slate-50 flex items-center gap-3"
            >
                <Settings size={18} />
                Settings
            </button>
            
            <hr />
            <button
                onClick={logout}
                className="w-full px-5 py-3 hover:bg-red-50 text-red-500 flex items-center gap-3"
            >
                <LogOut size={18} />
                Logout
            </button>
        </div>
    );
}